import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { refreshApex } from "@salesforce/apex";
import translateDocument from '@salesforce/apex/DeeplAPIController.translateDocument';
import checkDocumentStatus from '@salesforce/apex/DeeplAPIController.checkDocumentStatus';
import downloadTranslatedDocument from '@salesforce/apex/DeeplAPIController.downloadTranslatedDocument';
import sfFilesComponent from 'c/sfFilesComponent';
import getFiles from '@salesforce/apex/ContentVersionController.getFiles';
import getFileVersionData from '@salesforce/apex/ContentVersionController.getFileVersionData';
import translateComplexDocument from '@salesforce/apex/DeeplAPIController.translateComplexDocument';
export default class DeeplTranslateFiles extends LightningElement {    
    @api supportedLanguages = [];
    documentId
    documentKey
    textSource = '';
    timeout;  
    textTargetLang = 'EN';
    textSourceLang = '';
    textTarget = '';
    formalityOptions = 'prefer_less';
    fileName
    fileContent
    fileType
    isFileUploaded = false;
    isFileTranslated = false;
    isLoadingSpinner = false;
    tempResponse;
    statusResult;
    tableData;
    translatedTo;
    intervalId;
    @wire(checkDocumentStatus, { documentId: '$documentId', documentKey: '$documentKey' })
    receiveStatus(result) {
        this.statusResult = result;
        const {error, data} = result;
        if(error) {
            this.showToast('Error', error.message, 'error');
        }
        else if(data) {
            console.log('translation status', data.status);
            console.log('billed_characters', data.billed_characters)
            this.provideActionOnTranslatedFile(data);
        }
    }

    get sourceLangOptions() {
        if(!this.supportedLanguages) {
            return;
        }

        const automaticChoice = { label: 'Automatic Detection', value: '' };
        return [
            automaticChoice,
            ...this.supportedLanguages.map(language => ({
                label: language.label,
                value: language.value
            }))
        ];
    }

    get translatedLanguage() {
        const language = this.supportedLanguages.find(lang => lang.value === this.translatedTo);
        return language ? language.label.toLowerCase() : '';
    }

    handleLanguagePreference(event) {
        if(event.target.name === 'sourceLang') {
            this.textSourceLang = event.detail.value;
        }
        else if(event.target.name === 'targetLang') {
            this.textTargetLang = event.detail.value;
        }
    }

    handleTranslateFile() {
        this.translateFile();
    }

    handleFormallityOptions(event) {
        this.formalityOptions = event.detail.checked ? 'prefer_more' : 'prefer_less' 
    }
    
    openLocalFileUpload(event) {
        const file = event.target.files[0];
        console.log('file', file)
        console.log('filetype', file.type);
       
        let reader = new FileReader();
        reader.onload = () => {
            this.fileContent = reader.result;
            console.log(this.fileContent);
            this.isFileUploaded = true;
            this.fileName = file.name;  
            this.fileType = file.type;
        }
        if(this.fileType == 'text/plain') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }  
    }

    async openSaleforceFileUpload() {
        await this.receiveDataTableData();
        const jsonString = await this.openModal();
        const fileResult = JSON.parse(jsonString);
        const res = await getFileVersionData({id:fileResult[0].id});
        this.fileContent = res;
        console.log('Version Data: ', this.fileContent)
        this.fileName = fileResult[0].title + '.' + fileResult[0].fileExtension;
        this.fileType = fileResult[0].fileExtension;
        this.isFileUploaded = true;
    }
    // So far there have been attempts to implement pdf files
    downloadFileToLocalMachine(filename, data) {
        console.log('this.fileType', this.fileType)
        if(this.fileType == 'pdf') {
            let binaryString = window.atob(data);
            console.log('binaryString', binaryString)
            let binaryLen = binaryString.length;
            console.log('binaryLen', binaryLen)
            let bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
               let ascii = binaryString.charCodeAt(i);
               bytes[i] = ascii;
            }
            let blob = new Blob([bytes], { type: 'application/pdf' });
            let url = URL.createObjectURL(blob);
            let link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        else {
            let blob = new Blob([data], { type: 'text/plain' });
            let url = URL.createObjectURL(blob);
            let link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    handleTranslateFileCancelation() {
        this.isFileUploaded = false;
        this.isFileTranslated = false;
        this.isLoadingSpinner = false;
    }

    handleDownload() {
        this.downloadFileToLocalMachine(this.fileName, this.tempResponse);
    }

    showToast(title, message, variant){
        const toastEvent = new ShowToastEvent({
            title: title,
            variant: variant,
            message: message,
        });
        this.dispatchEvent(toastEvent);
    }

    async receiveDataTableData() {
        const files = await getFiles({ fileNameFilter: '' });
        console.log('files', files)
        this.tableData = files.map(file => ({
            id: file.Id,
            title: file.Title,
            fileExtension: file.FileExtension,
            versionData: file.VersionData
        }));
        console.log('this.tableData', JSON.stringify(this.tableData))
    }

    translateFile() {
        translateDocument({
            documentContent : this.fileContent, 
            sourceLang: this.textSourceLang, 
            targetLang : this.textTargetLang, 
            formality: this.formalityOptions,
            fileName: this.fileName
        })
        .then(data => {
            const response = data;
            console.log('Response', response);
            this.documentId = response.document_id;
            this.documentKey = response.document_key;
            this.isFileUploaded = false;
            this.isLoadingSpinner = true;
            this.translatedTo = this.textTargetLang;
        })
        .catch(error => {
            this.showToast('Error', error.message, 'error');
        });
    }

    async openModal() {
        return await sfFilesComponent.open({
            label: 'Salesforce Org files',
            size: 'medium',
            description: 'Accessible description of modal\'s purpose',
            content: 'Passed into content api',
            columns: [
                { label: 'Title', fieldName: 'title'},
                { label: 'File Extension', fieldName: 'fileExtension' }
            ],
            tableData: this.tableData
        });
    }

    downloadFile() {
        downloadTranslatedDocument({
            documentId: this.documentId, 
            documentKey: this.documentKey
        })
        .then((response)=>{
            console.log('download response: ', response)
            console.log('fileName', this.fileName);
            this.tempResponse = response;
            this.downloadFileToLocalMachine(this.fileName , response);
        })
        .catch((error) => {
            this.showToast('Error', error.message, 'error');
        });
    }

    provideActionOnTranslatedFile(data) {
        if(data.status === 'error') {
            this.handleTranslateFileCancelation();
            this.showToast('Error', data.error_message, 'error');
        }
        if(data.status === 'translating' || data.status === 'queued') {
            this.intervalId = setInterval(() => {
                refreshApex(this.statusResult);
                if(this.statusResult.data && this.statusResult.data.status === 'done') {
                    clearInterval(this.intervalId);
                }
            }, 2000);
        }
        if(data.status === 'done') {
            this.isLoadingSpinner = false;
            this.isFileTranslated = true;
            this.downloadFile();
        }
    }
}