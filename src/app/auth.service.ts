import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  register(
    username: string,
    email: string,
    password: string,
    role: string
  ): Observable<User> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      map((users) => {
        const maxId =
          users.length > 0 ? Math.max(...users.map((user) => user.id ?? 0)) : 0;
        const newUser: User = {
          id: maxId + 1,
          username: username,
          email: email,
          password: password,
          roles: [role],
        };
        return newUser;
      }),
      map((newUser) => {
        this.http.post<User>(this.apiUrl, newUser).subscribe();
        return newUser;
      })
    );
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .get<User[]>(`${this.apiUrl}?email=${email}&password=${password}`)
      .pipe(
        map((users) => {
          if (users.length > 0) {
            this.currentUserSubject.next(users[0]);
            return true;
          } else {
            this.currentUserSubject.next(null);
            return false;
          }
        })
      );
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isAuthorized(allowedRoles: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return user.roles.some((role) => allowedRoles.includes(role));
  }
}
