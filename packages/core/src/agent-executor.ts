/**
 * Bagula Agent Executor
 * Executes AI agents across different providers
 */

import { AgentConfig, Message, ToolCall } from './types';
import { TokenUsage } from './metrics-collector';

export interface ExecutionResult {
  output: string;
  messages: Message[];
  toolCalls: ToolCall[];
  usage: TokenUsage;
  confidence?: number;
  modelCalls: number;
}

export class AgentExecutor {
  /**
   * Execute an agent with given input
   */
  async execute(
    input: string | Message[],
    config: AgentConfig,
    context?: Record<string, any>
  ): Promise<ExecutionResult> {
    // Convert input to messages
    const messages = this.prepareMessages(input, config, context);

    // Route to appropriate provider
    switch (config.provider) {
      case 'openai':
        return this.executeOpenAI(messages, config);
      case 'anthropic':
        return this.executeAnthropic(messages, config);
      case 'custom':
        return this.executeCustom(messages, config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Prepare messages for execution
   */
  private prepareMessages(
    input: string | Message[],
    config: AgentConfig,
    context?: Record<string, any>
  ): Message[] {
    const messages: Message[] = [];

    // Add system prompt if provided
    if (config.systemPrompt) {
      messages.push({
        role: 'system',
        content: config.systemPrompt,
      });
    }

    // Add context if provided
    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');

      messages.push({
        role: 'system',
        content: `Context:\n${contextStr}`,
      });
    }

    // Add input messages
    if (typeof input === 'string') {
      messages.push({
        role: 'user',
        content: input,
      });
    } else {
      messages.push(...input);
    }

    return messages;
  }

  /**
   * Execute with OpenAI
   */
  private async executeOpenAI(
    messages: Message[],
    config: AgentConfig
  ): Promise<ExecutionResult> {
    try {
      const OpenAI = require('openai').default;
      const openai = new OpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
        baseURL: config.baseUrl,
      });

      const tools = config.tools?.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      let modelCalls = 0;
      let allMessages = [...messages];
      let allToolCalls: ToolCall[] = [];

      // Execute with potential tool calls
      while (true) {
        modelCalls++;

        const response = await openai.chat.completions.create({
          model: config.model,
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
            tool_calls: m.toolCalls,
            tool_call_id: m.toolCallId,
          })),
          tools: tools && tools.length > 0 ? tools : undefined,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        });

        const choice = response.choices[0];
        const message = choice.message;

        // Add assistant message
        const assistantMessage: Message = {
          role: 'assistant',
          content: message.content || '',
          toolCalls: message.tool_calls?.map((tc: any) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          })),
        };
        allMessages.push(assistantMessage);

        // If no tool calls, we're done
        if (!message.tool_calls || message.tool_calls.length === 0) {
          const totalUsage: TokenUsage = {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          };

          return {
            output: message.content || '',
            messages: allMessages,
            toolCalls: allToolCalls,
            usage: totalUsage,
            modelCalls,
          };
        }

        // Execute tool calls
        for (const toolCall of message.tool_calls) {
          const tool = config.tools?.find((t) => t.name === toolCall.function.name);

          if (!tool || !tool.handler) {
            throw new Error(`Tool ${toolCall.function.name} not found or has no handler`);
          }

          const toolResult = await tool.handler(
            JSON.parse(toolCall.function.arguments)
          );

          allToolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          });

          allMessages.push({
            role: 'tool',
            content: JSON.stringify(toolResult),
            toolCallId: toolCall.id,
          });
        }

        // Prevent infinite loops
        if (modelCalls > 10) {
          throw new Error('Too many model calls, possible infinite loop');
        }
      }
    } catch (error: any) {
      throw new Error(`OpenAI execution failed: ${error.message}`);
    }
  }

  /**
   * Execute with Anthropic
   */
  private async executeAnthropic(
    messages: Message[],
    config: AgentConfig
  ): Promise<ExecutionResult> {
    try {
      const Anthropic = require('anthropic').default;
      const anthropic = new Anthropic({
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
        baseURL: config.baseUrl,
      });

      // Extract system messages
      const systemMessages = messages.filter((m) => m.role === 'system');
      const system = systemMessages.map((m) => m.content).join('\n\n');
      const conversationMessages = messages.filter((m) => m.role !== 'system');

      const tools = config.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));

      let modelCalls = 0;
      let allMessages = [...conversationMessages];
      let allToolCalls: ToolCall[] = [];

      while (true) {
        modelCalls++;

        const response = await anthropic.messages.create({
          model: config.model,
          system,
          messages: allMessages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          tools: tools && tools.length > 0 ? tools : undefined,
          temperature: config.temperature,
          max_tokens: config.maxTokens || 4096,
        });

        const content = response.content;

        // Extract text and tool uses
        const textContent = content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n');

        const toolUses = content.filter((c: any) => c.type === 'tool_use');

        // Add assistant message
        allMessages.push({
          role: 'assistant',
          content: textContent,
        });

        // If no tool uses, we're done
        if (toolUses.length === 0) {
          const totalUsage: TokenUsage = {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          };

          return {
            output: textContent,
            messages: allMessages,
            toolCalls: allToolCalls,
            usage: totalUsage,
            modelCalls,
          };
        }

        // Execute tool calls
        for (const toolUse of toolUses) {
          const tool = config.tools?.find((t) => t.name === toolUse.name);

          if (!tool || !tool.handler) {
            throw new Error(`Tool ${toolUse.name} not found or has no handler`);
          }

          const toolResult = await tool.handler(toolUse.input);

          allToolCalls.push({
            id: toolUse.id,
            name: toolUse.name,
            arguments: toolUse.input,
          });

          allMessages.push({
            role: 'user',
            content: JSON.stringify({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult),
            }),
          });
        }

        // Prevent infinite loops
        if (modelCalls > 10) {
          throw new Error('Too many model calls, possible infinite loop');
        }
      }
    } catch (error: any) {
      throw new Error(`Anthropic execution failed: ${error.message}`);
    }
  }

  /**
   * Execute with custom provider
   */
  private async executeCustom(
    messages: Message[],
    config: AgentConfig
  ): Promise<ExecutionResult> {
    throw new Error(
      'Custom provider execution not implemented. Please provide a custom executor.'
    );
  }
}
