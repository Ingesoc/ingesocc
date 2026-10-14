import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideTrash2 } from '@lucide/angular';
import { ContactMessagesService, type ContactMessage, type LeadStatus } from '../data-access/contact-messages.service';

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [LucideTrash2],
  templateUrl: './messages-inbox.component.html',
})
export class MessagesInboxComponent implements OnInit {
  private readonly messages = inject(ContactMessagesService);

  readonly items = this.messages.messages;
  readonly loading = signal(true);
  readonly error = signal('');

  readonly statusOptions: { value: LeadStatus; label: string }[] = [
    { value: 'new', label: 'Nuevo' },
    { value: 'contacted', label: 'Contactado' },
    { value: 'closed', label: 'Cerrado' },
  ];

  readonly unreadCount = () => this.items().filter((item) => !item.read).length;

  async ngOnInit(): Promise<void> {
    try {
      await this.messages.load();
    } catch {
      this.error.set('No se pudieron cargar los mensajes.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Resalta spam y mensajes sin leer sin anidar ternarios en la plantilla. */
  cardClass(item: ContactMessage): string {
    if (item.is_spam) return 'rounded-sm border border-accent/50 bg-accent-soft/40 p-6';
    return item.read
      ? 'rounded-sm border border-border bg-surface p-6'
      : 'rounded-sm border-l-2 border-l-accent border border-border bg-surface p-6';
  }

  /** ¿El lead trae contexto comercial del formulario (tipo/presupuesto/plazo)? */
  hasContext(item: ContactMessage): boolean {
    return Boolean(item.project_type || item.budget_range || item.timeline);
  }

  async toggleRead(id: string, current: boolean): Promise<void> {
    try {
      await this.messages.setRead(id, !current);
    } catch {
      this.error.set('No se pudo actualizar el mensaje.');
    }
  }

  async onStatusChange(item: ContactMessage, value: string): Promise<void> {
    try {
      await this.messages.setStatus(item.id, value as LeadStatus);
    } catch {
      this.error.set('No se pudo actualizar el estado del lead.');
    }
  }

  async onDelete(id: string): Promise<void> {
    if (!window.confirm('¿Eliminar este mensaje? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await this.messages.remove(id);
    } catch {
      this.error.set('No se pudo eliminar el mensaje.');
    }
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}