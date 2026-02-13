# Bagula.ai Website

Premium landing page for Bagula.ai built with Next.js 14, TypeScript, and Tailwind CSS.

## Design Principles

This website follows the design principles of Extend.ai:

- Clean, neutral color palette (stone/slate grays with blue accents)
- Custom typography using Inter font
- Generous whitespace and consistent grid systems
- Minimalist CTAs and clear hierarchy
- Enterprise trust signals
- Social proof sections

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
packages/website/
├── app/
│   ├── layout.tsx      # Root layout with fonts and metadata
│   ├── page.tsx        # Landing page composition
│   └── globals.css     # Global styles and Tailwind imports
├── components/
│   ├── Hero.tsx            # Hero section with navigation
│   ├── ProblemSection.tsx  # Problem statement section
│   ├── Features.tsx        # Feature showcase
│   ├── HowItWorks.tsx      # 3-step process
│   ├── SocialProof.tsx     # Testimonials and stats
│   ├── Pricing.tsx         # Pricing plans
│   └── Footer.tsx          # Footer navigation
└── public/
    └── (illustrations)     # Placeholder for future illustrations
```

## Customization

### Colors

The color palette is defined in `tailwind.config.ts`:

- Primary: Blue accent colors
- Neutral: Stone/slate grays for backgrounds and text

### Typography

The site uses the Inter font family, loaded via Next.js font optimization in `app/layout.tsx`.

### Content

To update content, edit the respective component files in the `components/` directory.

## Building for Production

```bash
npm run build
npm start
```

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first CSS framework
- **Inter Font**: Modern sans-serif typography

## License

Apache 2.0
