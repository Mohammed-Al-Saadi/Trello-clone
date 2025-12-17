import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ToastService } from '../components/reusable-toast/toast-service';

@Injectable({
  providedIn: 'root',
})
export class CardContentService {
  private http = inject(HttpClient);
  toast = inject(ToastService);

  async addCardContent(
    card_id: number,
    content_html?: string,
    due_date?: string | null,
    status?: boolean
  ) {
    const body: any = { card_id };

    if (content_html !== undefined) body.content_html = content_html;
    if (due_date !== undefined) body.due_date = due_date;
    if (status !== undefined) body.status = status;

    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/add-cards-content', body, {
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

      return res;
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

  async addCardComment(card_id: number, user_id?: number, comment?: string) {
    const body: any = { card_id, user_id, comment };

    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/add-card-comment', body, {
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

      return res;
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
  async deleteCardComment(comment_id: number) {
    const body: any = { comment_id };

    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/delete-comment', body, {
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

      return res;
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

  async getCardContent(card_id: number) {
    const body = { card_id };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/get-card-content', body, {
          withCredentials: true,
        })
      );

      return res;
    } catch (error: any) {
      throw error;
    }
  }
}
