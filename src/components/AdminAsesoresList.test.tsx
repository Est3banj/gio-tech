import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminAsesoresList from './AdminAsesoresList';
import { Asesor } from '../types';

const mockAsesores: Asesor[] = [
  {
    id: 'asesor-1',
    nombreCompleto: 'Juan Pérez',
    email: 'juan@giotech.com',
    whatsappNumber: '573001234567',
    rol: 'asesor',
  },
  {
    id: 'asesor-2',
    nombreCompleto: 'María López',
    email: 'maria@giotech.com',
    whatsappNumber: '573119876543',
    rol: 'admin',
  },
];

describe('AdminAsesoresList Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all advisors with names, emails, and roles', () => {
    render(
      <AdminAsesoresList
        asesores={mockAsesores}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole('heading', { name: /Asesores Registrados/i })).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('juan@giotech.com')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('filters advisors in real-time by search query', () => {
    render(
      <AdminAsesoresList
        asesores={mockAsesores}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar asesor por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'María' } });

    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
  });

  it('calls onEdit when clicking the edit button', () => {
    render(
      <AdminAsesoresList
        asesores={mockAsesores}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editBtn = screen.getByRole('button', { name: /Editar Juan Pérez/i });
    fireEvent.click(editBtn);

    expect(mockOnEdit).toHaveBeenCalledWith(mockAsesores[0]);
  });

  it('calls onDelete when clicking the delete button', () => {
    render(
      <AdminAsesoresList
        asesores={mockAsesores}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Eliminar Juan Pérez/i });
    fireEvent.click(deleteBtn);

    expect(mockOnDelete).toHaveBeenCalledWith('asesor-1');
  });

  it('contains zero raw emoji characters and uses vector icons', () => {
    const { container } = render(
      <AdminAsesoresList
        asesores={mockAsesores}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    expect(container.querySelector('.bi-whatsapp')).toBeInTheDocument();
    expect(container.querySelector('.bi-pencil-square')).toBeInTheDocument();
    expect(container.querySelector('.bi-trash3')).toBeInTheDocument();
  });
});
