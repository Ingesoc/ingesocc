import { Component, inject, signal } from '@angular/core';
import { LucideMail, LucideTrash2 } from '@lucide/angular';
import { ContactMessagesService } from '../data-access/contact-messages.service';

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [LucideMail, LucideTrash2],
  templateUrl: './messages-inbox.component.html',
})
export class MessagesInboxComponent {
  private readonly messages = inject(ContactMessagesService);

  readonly items = this.messages.messages;
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      await this.messages.load();
    } catch {
      this.error.set('No se pudieron cargar los mensajes.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleRead(id: string, current: boolean): Promise<void> {
    try {
      await this.messages.setRead(id, !current);
    } catch {
      this.error.set('No se pudo actualizar el mensaje.');
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