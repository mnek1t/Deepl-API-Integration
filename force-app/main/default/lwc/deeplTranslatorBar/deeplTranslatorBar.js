import { LightningElement } from 'lwc';
import getSupportedLaguages from '@salesforce/apex/DeeplAPIController.getSupportedLaguages';
import customIcon from '@salesforce/resourceUrl/DeepL_Logo';
export default class DeeplTranslatorBar extends LightningElement 
{
    supportedLanguages;
    customIcon = customIcon;
    connectedCallback() {
        this.loadSupportedLanguages();
    }

    async loadSupportedLanguages() {
            const response = await getSupportedLaguages();
            this.supportedLanguages = response.map((value) => {
                return {
                    label: value.name,
                    value: value.language
                }
        })
    }

}