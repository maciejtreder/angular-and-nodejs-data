import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID, Optional } from '@angular/core';
import { BehaviorSubject, Subject, Observable, ReplaySubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { isPlatformServer } from '@angular/common';
import { TransferState, makeStateKey, StateKey } from '@angular/platform-browser';

@Injectable({
 providedIn: 'root'
})
export class FileService {
 private fileList: string[] = new Array<string>();
 private fileList$: Subject<string[]> = new ReplaySubject<string[]>(1);
 private displayLoader$: Subject<boolean> = new BehaviorSubject<boolean>(false);

 constructor(
  private http: HttpClient,
  @Optional() @Inject('LIST_FILES') private listFiles: (callback) => void,
  @Inject(PLATFORM_ID) private platformId: any,
  private transferState: TransferState
  ) {
   const transferKey: StateKey<string> = makeStateKey<string>('fileList');
   if (isPlatformServer(this.platformId)) {
    this.listFiles((err, files) => {
      this.fileList = files;
      this.transferState.set(transferKey, this.fileList);
    });
   } else {
     this.fileList = this.transferState.get<string[]>(transferKey, []);
   }
   this.fileList$.next(this.fileList);
 } 

 public isLoading(): Observable<boolean> {
   return this.displayLoader$;
 }

 public upload(fileName: string, fileContent: string): void {
   this.displayLoader$.next(true);
   this.http.put('/files', {name: fileName, content: fileContent})
   .pipe(finalize(() => this.displayLoader$.next(false)))
   .subscribe(res => {
     this.fileList.push(fileName);
     this.fileList$.next(this.fileList);
   }, error => {
     this.displayLoader$.next(false);
   });
 }

 public download(fileName: string): void {
   this.http.get(`/files/${fileName}`, { responseType: 'blob'}).subscribe(res => {
     window.open(window.URL.createObjectURL(res));
   });
 }

 public remove(fileName): void {
   this.http.delete(`/files/${fileName}`).subscribe(() => {
     this.fileList.splice(this.fileList.findIndex(name => name === fileName), 1);
     this.fileList$.next(this.fileList);
   });
 }

 public list(): Observable<string[]> {
   return this.fileList$;
 }

 private addFileToList(fileName: string): void {
   this.fileList.push(fileName);
   this.fileList$.next(this.fileList);
 }
}
