import { render, screen } from '@testing-library/react';

describe('Example Test', () => {
  it('should run without errors', () => {
    render(<div>Hello Test</div>);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});
