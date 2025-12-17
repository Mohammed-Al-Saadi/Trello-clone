import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ToastService } from '../components/reusable-toast/toast-service'; // adjust path if needed

@Injectable({
  providedIn: 'root',
})
export class ProjectMembership {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  async addProjectMembership(
    project_id: number,
    role_id: number,
    email: string,
    added_by: number,
    role_name: string
  ) {
    const body = { project_id, role_id, email, added_by, role_name };

    try {
      const response: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/add-project-membership', body, {
          withCredentials: true,
        })
      );

      if (response?.message) {
        this.toast.showMessage({
          id: 1,
          type: 'success',
          text: response.message || 'New owner added successfully',
        });
      }

      return response;
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

  async deleteProjectMembership(project_id: number, user_id: number, role_name: string) {
    const body = { project_id, user_id };

    try {
      const response: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/delete-project-membership', body, {
          withCredentials: true,
          headers: {
            'X-Role-Name': role_name || '',
          },
        })
      );

      if (response?.message) {
        this.toast.showMessage({
          id: 1,
          type: 'success',
          text: response.message,
        });
      }

      return response;
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

  async editProjectUserRole(
    project_id: number,
    user_id: number,
    role_id: number,
    role_name: string
  ) {
    const body = { project_id, user_id, role_id, role_name };

    try {
      const response: any = await lastValueFrom(
        this.http.post('http://127.0.0.1:8080/edit-project-membership', body, {
          withCredentials: true,
          headers: {
            'X-Role-Name': role_name || '',
          },
        })
      );

      if (response?.message) {
        this.toast.showMessage({
          id: 1,
          type: 'success',
          text: response.message,
        });
      }

      return response;
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
