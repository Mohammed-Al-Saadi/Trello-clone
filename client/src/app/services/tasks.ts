import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ToastService } from '../components/reusable-toast/toast-service';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private http = inject(HttpClient);
  toast = inject(ToastService);

  async addNewtask(list_id: number, title: string, created_by: number, priority: string) {
    const body = { list_id, title, created_by, priority };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/add-cards', body, {
          withCredentials: true,
        })
      );

      if (res?.message) {
        this.toast.showMessage({
          id: 1,
          type: 'success',
          text: res.message,
        });
      }
    } catch (error: any) {
      const backendMessage =
        error?.error?.error || error?.error?.details || error?.message || 'Something went wrong';

      this.toast.showMessage({
        id: 1,
        type: 'error',
        text: backendMessage,
      });

      throw error;
    }
  }

  async deleteTask(card_id: number, role_name: string) {
    const body = { card_id, role_name };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/delete-cards', body, {
          withCredentials: true,
          headers: {
            'X-Role-Name': role_name || '',
          },
        })
      );

      if (res?.message) {
        this.toast.showMessage({
          id: 1,
          type: 'success',
          text: res.message,
        });
      }
    } catch (error: any) {
      const backendMessage =
        error?.error?.error || error?.error?.details || error?.message || 'Something went wrong';

      this.toast.showMessage({
        id: 1,
        type: 'error',
        text: backendMessage,
      });

      throw error;
    }
  }
  async moveTasksInList(list_id: number, cards: []) {
    const body = { list_id, cards };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/update-cards-list', body, {
          withCredentials: true,
        })
      );
    } catch (error: any) {
      const backendMessage =
        error?.error?.error || error?.error?.details || error?.message || 'Something went wrong';

      throw error;
    }
  }
  async moveTasksToOtherList(card_id: number, new_list_id: number, new_position: number) {
    const body = { card_id, new_list_id, new_position };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/move-card-to-new-list', body, {
          withCredentials: true,
        })
      );
    } catch (error: any) {
      const backendMessage =
        error?.error?.error || error?.error?.details || error?.message || 'Something went wrong';
      throw error;
    }
  }

  async updateTaskDetails(card_id: number, title?: string, priority?: string) {
    const body: any = { card_id };

    if (title !== undefined) body.title = title;
    if (priority !== undefined) body.priority = priority;

    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/update-card-details', body, {
          withCredentials: true,
        })
      );

      if (res?.message) {
        this.toast.showMessage({
          id: 1,
          type: 'success',
          text: res.message,
        });
      }
    } catch (error: any) {
      const backendMessage =
        error?.error?.error || error?.error?.details || error?.message || 'Something went wrong';

      this.toast.showMessage({
        id: 1,
        type: 'error',
        text: backendMessage,
      });

      throw error;
    }
  }
}
