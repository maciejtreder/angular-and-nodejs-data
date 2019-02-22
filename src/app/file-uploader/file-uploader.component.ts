import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { FileService } from '../file.service';

@Component({
 selector: 'app-file-uploader',
 templateUrl: './file-uploader.component.html',
 styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent {

 public formGroup = this.fb.group({
   file: [null, Validators.required]
 });

 private fileName;

 constructor(private fb: FormBuilder, private fileService: FileService) { }

 public onFileChange(event) {
   const reader = new FileReader();

   if (event.target.files && event.target.files.length) {
     this.fileName = event.target.files[0].name;
     const [file] = event.target.files;
     reader.readAsDataURL(file);
    
     reader.onload = () => {
       this.formGroup.patchValue({
         file: reader.result
       });
     };
   }
 }

 public onSubmit(): void {
   this.fileService.upload(this.fileName, this.formGroup.get('file').value);
 }
}
