import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ToastService } from '../components/reusable-toast/toast-service';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private http = inject(HttpClient);
  toast = inject(ToastService);

  async addNewBoard(
    project_id: number,
    name: string,
    position: number,
    category: string,
    role_name: string
  ) {
    const body = { project_id, name, position, category, role_name };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/add-board', body, {
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
  async deleteBoard(project_id: number, board_id: number, role_name: string) {
    const body = { project_id, board_id, role_name };
    try {
      const res: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/delete-board', body, {
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

  async getBoards(project_id: number, user_id: number) {
    const body = { project_id, user_id };
    const res = await lastValueFrom(
      this.http.post('http://127.0.0.1:8080/get-boards', body, {
        withCredentials: true,
      })
    );
    return res;
  }

  async editBoard(board_id: number, name: string, category: string, role_name: string) {
    const body = { board_id, name, category, role_name };

    try {
      const res: any = await lastValueFrom(
        this.http.put('http://127.0.0.1:8080/edit-board', body, {
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
