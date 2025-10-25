# W3Swap Frontend

A modern, secure, and responsive frontend for the W3Swap token migration platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Next.js 14** with App Router for optimal performance
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** with custom design system for consistent UI
- **Solana Wallet Integration** supporting all major wallets
- **Real-time Updates** with TanStack Query for data synchronization
- **Responsive Design** optimized for desktop and mobile
- **Dark Theme** with glassmorphism effects
- **Component Library** built with Radix UI primitives
- **Performance Optimized** with code splitting and lazy loading

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14.2+** - React framework with App Router
- **React 18** - UI library with Suspense boundaries
- **TypeScript** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 3.4+** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Custom Design System** - W3Swap brand colors and components

### Blockchain Integration
- **@solana/web3.js** - Solana blockchain interactions
- **@solana/wallet-adapter-react** - Wallet connection management
- **@coral-xyz/anchor** - Solana program interactions
- **@meteora-ag/dlmm** - Meteora DLMM pool integration

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query v5** - Server state management and caching
- **React Hook Form** - Form state management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript** - Static type checking

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm 9+
- Access to W3Swap smart contract (deployed on Solana)

### Setup Steps

1. **Clone and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # App Configuration
   NEXT_PUBLIC_APP_NAME=W3Swap
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Solana Configuration
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   
   # W3Swap Program ID
   NEXT_PUBLIC_W3SWAP_PROGRAM_ID=your_program_id_here
   
   # Meteora Configuration
   NEXT_PUBLIC_METEORA_DLMM_PROGRAM_ID=LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo
   NEXT_PUBLIC_METEORA_API_URL=https://dlmm-api.meteora.ag
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/       # Marketing pages (home, about)
│   ├── admin/             # Admin dashboard pages
│   ├── migrate/           # Migration interface pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   ├── providers.tsx     # App providers
│   └── globals.css       # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── wallet/           # Wallet integration
│   └── theme/            # Theme components
├── lib/                  # Utility functions and configurations
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🎨 Design System

### Colors

The W3Swap design system uses a dark-first approach with carefully crafted color palette:

- **Primary**: `#00D4FF` (Cyan) - Main brand color
- **Secondary**: `#7B3FF2` (Purple) - Secondary actions
- **Success**: `#10B981` (Green) - Success states
- **Warning**: `#F59E0B` (Amber) - Warning states
- **Danger**: `#EF4444` (Red) - Error states
- **Background**: `#0F0F0F` - Main background
- **Surface**: `#1A1A1A` - Card backgrounds

### Components

All UI components follow consistent patterns:

```tsx
// Example: Button component usage
<Button variant="primary" size="lg" loading={isLoading}>
  Migrate Tokens
</Button>

// Example: Card component usage
<Card variant="glass">
  <CardHeader>
    <CardTitle>Project Statistics</CardTitle>
    <CardDescription>Real-time migration data</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Responsive Design

The design system includes responsive utilities:

- **Mobile-first** approach with Tailwind CSS
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- **Container**: Responsive container with proper padding
- **Grid**: Responsive grid system for layouts

## 🔗 Wallet Integration

### Supported Wallets

- **Phantom** (Primary)
- **Solflare**
- **Backpack**
- **Glow**
- **Brave Wallet**

### Usage

```tsx
import { useWallet } from '@solana/wallet-adapter-react';

function MyComponent() {
  const { connected, publicKey, signTransaction } = useWallet();
  
  if (!connected) {
    return <WalletMultiButton />;
  }
  
  return <div>Connected: {publicKey?.toString()}</div>;
}
```

## 📊 State Management

### Server State (TanStack Query)

```tsx
import { useQuery } from '@tanstack/react-query';

function ProjectList() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 60 * 1000, // 1 minute
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  return <ProjectGrid projects={projects} />;
}
```

### Client State (Zustand)

```tsx
import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript checker
npm run test         # Run Jest tests
npm run test:e2e     # Run Playwright E2E tests
```

### Code Quality

The project includes:

- **ESLint** configuration for code quality
- **Prettier** for consistent formatting
- **Husky** for pre-commit hooks
- **TypeScript** strict mode enabled
- **Lint-staged** for staged file linting

### Testing

```bash
# Unit tests with Jest
npm run test

# E2E tests with Playwright
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Environment Configuration

Set production environment variables:

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_W3SWAP_PROGRAM_ID=your_mainnet_program_id
```

### Deployment Options

- **Vercel** (Recommended) - Optimized for Next.js
- **Netlify** - Static site hosting
- **Docker** - Containerized deployment
- **Self-hosted** - Custom server deployment

## 🎯 Features Overview

### For Token Holders (Migration Interface)

1. **Browse Active Migrations** - Discover available token migration projects
2. **Connect Wallet** - Secure wallet integration with major Solana wallets
3. **Migrate Tokens** - One-click token migration with real-time preview
4. **Trade Immediately** - Access to Meteora LP for instant trading post-migration
5. **Track History** - View personal migration history and statistics

### For Project Admins (Admin Dashboard)

1. **Create Projects** - Multi-step wizard for setting up migration projects
2. **Configure LP Parameters** - Set initial price, token allocation, and trading fees
3. **Manage Projects** - Start, pause, resume, and end migration periods
4. **Monitor Progress** - Real-time analytics and migration statistics
5. **LP Management** - Configure and monitor Meteora liquidity pools

### Key UI Components

- **Project Cards** - Display migration project information
- **Migration Interface** - Token amount input with exchange rate preview
- **Wallet Connection** - Seamless wallet integration
- **Analytics Dashboard** - Charts and statistics for project performance
- **Transaction Toasts** - Real-time transaction status updates

## 🔧 Customization

### Theme Customization

Modify `tailwind.config.js` to customize colors, spacing, and other design tokens:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#00D4FF', // Your custom primary color
        },
      },
    },
  },
};
```

### Component Customization

Components use class-variance-authority for variant management:

```tsx
const buttonVariants = cva(
  'base-button-classes',
  {
    variants: {
      variant: {
        primary: 'primary-variant-classes',
        custom: 'your-custom-variant-classes',
      },
    },
  }
);
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [TanStack Query](https://tanstack.com/query/latest)
- [Radix UI](https://www.radix-ui.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add new feature"`
5. Push to branch: `git push origin feature/new-feature`
6. Create a Pull Request

## 📄 License

This project is part of the W3Swap platform. See the main repository for license information.