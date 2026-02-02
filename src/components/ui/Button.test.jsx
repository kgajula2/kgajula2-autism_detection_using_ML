import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { Card } from './Card';

describe('Button Component', () => {
    it('renders with children text', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('has focus ring classes for accessibility', () => {
        render(<Button>Focus Test</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('focus:ring');
    });

    it('applies variant styles', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('purple');
    });

    it('has correct aria-label when provided', () => {
        render(<Button ariaLabel="Submit form">Submit</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Submit form');
    });
});

describe('Card Component', () => {
    it('renders children content', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies glass variant when glass prop is true', () => {
        render(<Card glass>Glass Card</Card>);
        const card = screen.getByText('Glass Card').parentElement;
        expect(card.className).toContain('glass-card');
    });

    it('supports keyboard navigation when onClick provided', () => {
        const handleClick = vi.fn();
        render(<Card onClick={handleClick}>Interactive Card</Card>);

        const card = screen.getByText('Interactive Card').closest('[role="button"]');
        expect(card).toBeInTheDocument();
        expect(card).toHaveAttribute('tabIndex', '0');

         
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(handleClick).toHaveBeenCalledTimes(1);

         
        fireEvent.keyDown(card, { key: ' ' });
        expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('is not interactive when no onClick provided', () => {
        render(<Card>Static Card</Card>);
        const card = screen.getByText('Static Card').parentElement;
        expect(card).not.toHaveAttribute('role', 'button');
    });
});
