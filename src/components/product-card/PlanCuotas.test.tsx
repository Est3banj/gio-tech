import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlanCuotas from './PlanCuotas';

describe('PlanCuotas', () => {
  it('renders exclusive 12 months plan when solo12Meses is true and cuotas12 is present', () => {
    render(
      <PlanCuotas
        cuotaInicial={500000}
        cuotaInicialStr="$500.000"
        solo12Meses={true}
        cuotas12={350000}
        cuotas12Str="$350.000"
        cuotas6Str="$200.000"
        cuotas8Str="$380.000"
      />
    );

    expect(screen.getByText('Simulador de Financiación')).toBeInTheDocument();
    expect(screen.getByText(/Cuota inicial: \$500\.000/)).toBeInTheDocument();
    expect(screen.getByText('PLAN ESPECIAL EXCLUSIVO')).toBeInTheDocument();
    expect(screen.getByText('12 cuotas mensuales de $350.000')).toBeInTheDocument();
    expect(screen.getByText('Financiación a 1 año con tasa preferencial')).toBeInTheDocument();

    // Must NOT render pills in solo12Meses
    expect(screen.queryByText('16 Quincenas')).not.toBeInTheDocument();
    expect(screen.queryByText('8 Meses')).not.toBeInTheDocument();
    expect(screen.queryByText('6 Quincenas')).not.toBeInTheDocument();
  });

  it('renders standard plan with only 16 Quincenas and 8 Meses options (no 6 Quincenas)', () => {
    render(
      <PlanCuotas
        cuotaInicial={0}
        cuotaInicialStr="$0"
        solo12Meses={false}
        cuotas12={null}
        cuotas12Str=""
        cuotas6Str="$150.000"
        cuotas8Str="$280.000"
      />
    );

    expect(screen.getByText('Simulador de Financiación')).toBeInTheDocument();
    // Cuota inicial badge should NOT appear if 0
    expect(screen.queryByText(/Cuota inicial:/)).not.toBeInTheDocument();

    // Valid business terms
    const pill16q = screen.getByRole('button', { name: /^16 Quincenas/i });
    const pill8m = screen.getByRole('button', { name: /^8 Meses/i });
    expect(pill16q).toBeInTheDocument();
    expect(pill8m).toBeInTheDocument();

    // 6 Quincenas must NOT exist
    expect(screen.queryByRole('button', { name: /^6 Quincenas/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^6 Quincenas/i)).not.toBeInTheDocument();

    // Default is 16 Quincenas
    expect(pill16q).toHaveClass('active');
    expect(pill8m).not.toHaveClass('active');
    expect(screen.getByText('/ quincena')).toBeInTheDocument();
    expect(screen.getAllByText('16 cuotas quincenales:')).toHaveLength(2); // Top summary + bottom detail text
    expect(screen.getAllByText('8 cuotas mensuales:')).toHaveLength(1); // Bottom detail text only

    // Switch to 8 Meses
    fireEvent.click(pill8m);
    expect(pill8m).toHaveClass('active');
    expect(pill16q).not.toHaveClass('active');
    expect(screen.getByText('/ mes')).toBeInTheDocument();
    expect(screen.getAllByText('8 cuotas mensuales:')).toHaveLength(2); // Top summary + bottom detail text
    expect(screen.getAllByText('16 cuotas quincenales:')).toHaveLength(1); // Bottom detail text only

    // Switch back to 16 Quincenas
    fireEvent.click(pill16q);
    expect(pill16q).toHaveClass('active');
    expect(screen.getByText('/ quincena')).toBeInTheDocument();
    expect(screen.getAllByText('16 cuotas quincenales:')).toHaveLength(2);
    expect(screen.getAllByText('8 cuotas mensuales:')).toHaveLength(1);
  });

  it('returns null and renders nothing if cuota values are empty or missing', () => {
    const { container } = render(
      <PlanCuotas
        cuotaInicial={0}
        cuotaInicialStr=""
        solo12Meses={false}
        cuotas12={null}
        cuotas12Str=""
        cuotas6Str=""
        cuotas8Str=""
      />
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument();
  });

  it('returns null and renders nothing if solo12Meses is true but cuotas12 is missing', () => {
    const { container } = render(
      <PlanCuotas
        cuotaInicial={0}
        cuotaInicialStr=""
        solo12Meses={true}
        cuotas12={null}
        cuotas12Str=""
        cuotas6Str="$150.000"
        cuotas8Str="$280.000"
      />
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument();
  });
});
