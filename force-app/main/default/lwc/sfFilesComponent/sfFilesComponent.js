import { api } from 'lwc';
import LightningModal from 'lightning/modal';
export default class SfFilesComponent extends LightningModal {
    @api label
    @api columns = [];
    @api tableData = [];
    selectedRows
    handleOkay() {
        console.log("strgified", JSON.stringify(this.selectedRows));
        console.log("simple", this.selectedRows);
        this.close(JSON.stringify(this.selectedRows));
    }

    getSelectedRows(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedRows = selectedRows;
        console.log(JSON.stringify(this.selectedRows))
    }
}