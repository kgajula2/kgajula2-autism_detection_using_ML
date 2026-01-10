import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Title, SubTitle } from '../components/ui/Typography';

// Wrapper component for Router context
const TestWrapper = ({ children }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe('UI Components', () => {

    describe('Button Component', () => {
        it('renders with primary variant by default', () => {
            render(<Button>Click Me</Button>);
            const button = screen.getByRole('button', { name: /click me/i });
            expect(button).toBeInTheDocument();
            expect(button).toHaveClass('bg-blue-600');
        });

        it('renders with secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);
            const button = screen.getByRole('button', { name: /secondary/i });
            expect(button).toHaveClass('bg-purple-500');
        });

        it('disables button when disabled prop is true', () => {
            render(<Button disabled>Disabled Button</Button>);
            const button = screen.getByRole('button', { name: /disabled button/i });
            expect(button).toBeDisabled();
            expect(button).toHaveClass('opacity-50');
        });

        it('calls onClick handler when clicked', async () => {
            const handleClick = vi.fn();
            render(<Button onClick={handleClick}>Clickable</Button>);
            const button = screen.getByRole('button', { name: /clickable/i });
            button.click();
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Card Component', () => {
        it('renders children correctly', () => {
            render(<Card>Card Content</Card>);
            expect(screen.getByText('Card Content')).toBeInTheDocument();
        });

        it('applies glass class when glass prop is true', () => {
            render(<Card glass data-testid="glass-card">Glass Card</Card>);
            const card = screen.getByTestId('glass-card');
            expect(card).toHaveClass('glass-card');
        });

        it('applies custom className', () => {
            render(<Card className="custom-class" data-testid="custom-card">Custom</Card>);
            const card = screen.getByTestId('custom-card');
            expect(card).toHaveClass('custom-class');
        });
    });

    describe('Typography Components', () => {
        it('renders Title with gradient text', () => {
            render(<Title>Main Title</Title>);
            const title = screen.getByText('Main Title');
            expect(title).toBeInTheDocument();
            expect(title.tagName).toBe('H1');
        });

        it('renders SubTitle correctly', () => {
            render(<SubTitle>Subtitle Text</SubTitle>);
            const subtitle = screen.getByText('Subtitle Text');
            expect(subtitle).toBeInTheDocument();
            expect(subtitle.tagName).toBe('H2');
        });
    });
});
