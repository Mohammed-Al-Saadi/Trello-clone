import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ToastService } from '../components/reusable-toast/toast-service';

@Injectable({
  providedIn: 'root',
})
export class BoardListService {
  private http = inject(HttpClient);
  toast = inject(ToastService);

  async addNewBoardList(board_id: number, name: string, role_name: string) {
    const body = { board_id, name, role_name };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/add-board-list', body, {
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

  async getBoardList(board_id: number) {
    const body = { board_id };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/get-board-lists', body, {
          withCredentials: true,
        })
      );
      return res;
    } catch (error: any) {
      throw error;
    }
  }
  async updateListsPosition(data: any[]) {
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/update-board-list-positions', data, {
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
        error?.error?.error ||
        error?.error?.details ||
        error?.message ||
        'Failed to update list order';

      this.toast.showMessage({
        id: 1,
        type: 'error',
        text: backendMessage,
      });

      throw error;
    }
  }

  async updateListName(id: number, name: string, role_name: string) {
    const data = { id, name, role_name };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/update-list-name', data, {
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

      return res;
    } catch (error: any) {
      const backendMessage =
        error?.error?.error ||
        error?.error?.details ||
        error?.message ||
        'Failed to update list name';

      this.toast.showMessage({
        id: 1,
        type: 'error',
        text: backendMessage,
      });

      throw error;
    }
  }

  async deleteBoardList(list_id: number, role_name: string) {
    const body = { list_id, role_name };

    try {
      const res: any = await lastValueFrom(
        this.http.delete('http://127.0.0.1:8080/delete-board-list', {
          body,
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
}
