import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VariantTabs from '../../../src/components/VariantTabs.jsx';

describe('<VariantTabs />', () => {
  const variants = ['story variant text', 'contrarian variant text', 'numbers variant text'];

  it('renders nothing when variants empty', () => {
    const { container } = render(<VariantTabs variants={[]} platform="x" onSelect={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when variants undefined', () => {
    const { container } = render(<VariantTabs variants={undefined} platform="x" onSelect={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows first variant by default', () => {
    render(<VariantTabs variants={variants} platform="x" onSelect={() => {}} />);
    expect(screen.getByText('story variant text')).toBeInTheDocument();
  });

  it('switches preview when a tab is clicked', () => {
    render(<VariantTabs variants={variants} platform="linkedin" onSelect={() => {}} />);
    fireEvent.click(screen.getByText('Contrarian'));
    expect(screen.getByText('contrarian variant text')).toBeInTheDocument();
  });

  it('displays char count for active variant', () => {
    render(<VariantTabs variants={variants} platform="x" onSelect={() => {}} />);
    expect(screen.getByText(/18 chars/)).toBeInTheDocument();
  });

  it('shows correct platform label', () => {
    const { rerender } = render(<VariantTabs variants={variants} platform="x" onSelect={() => {}} />);
    expect(screen.getByText(/X \/ Twitter/)).toBeInTheDocument();
    rerender(<VariantTabs variants={variants} platform="linkedin" onSelect={() => {}} />);
    expect(screen.getByText(/LinkedIn/)).toBeInTheDocument();
  });

  it('calls onSelect with active variant when Use button clicked', () => {
    const onSelect = vi.fn();
    render(<VariantTabs variants={variants} platform="x" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Numbers'));
    fireEvent.click(screen.getByText(/Use this variant/));
    expect(onSelect).toHaveBeenCalledWith('numbers variant text');
  });

  it('falls back to Vn label when more than 3 variants', () => {
    const four = [...variants, 'fourth one'];
    render(<VariantTabs variants={four} platform="x" onSelect={() => {}} />);
    expect(screen.getByText('V4')).toBeInTheDocument();
  });
});
