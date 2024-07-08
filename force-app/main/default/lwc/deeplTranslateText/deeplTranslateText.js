import { LightningElement, api } from 'lwc';
import translate from '@salesforce/apex/DeeplAPIController.translateText';
import { formats } from 'c/utility';
export default class DeeplTranslateText extends LightningElement 
{
    @api supportedLanguages = [];
    FORMATS = formats
    textSource = '';
    timeout;
    textTargetLang = 'EN';
    textSourceLang = '';
    textTarget = '';
    formalityOptions = 'prefer_less';

    handleSourceTextInput(event) {
        this.textSource = event.detail.value;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.makeTranslateCallout();
        }, 700);
    }

    handleLanguagePreference(event) {
        if(event.target.name === 'sourceLang') {
            this.textSourceLang = event.detail.value;
        }
        else if(event.target.name === 'targetLang') {
            this.textTargetLang = event.detail.value;
        }
    }

    handleFormallityOptions(event) {
        this.formalityOptions = event.detail.checked ? 'prefer_more' : 'prefer_less' 
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.makeTranslateCallout();
        }, 300);
    }

    makeTranslateCallout() {
        if(!this.isTextExists) {
            this.textTarget = '';
            return; 
        }
        translate({
            text : this.textSource, 
            targetLang : this.textTargetLang, 
            sourceLang: this.textSourceLang, 
            formality: this.formalityOptions
        })
        .then(data => {
            const response = data;
            console.log('Translated response', response);
            this.textTarget = response.translations[0].text;
            console.log(this.textTarget)
        })
        .catch(error => {
            console.log(error);
        });
    }

    extractText(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent || tempDiv.innerText || '';
    }
    
    get isTextExists() {
        return this.extractText(this.textSource).trim().length > 0;
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
}