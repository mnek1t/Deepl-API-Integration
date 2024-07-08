public with sharing class ContentVersionController {
    @AuraEnabled
    public static List<ContentVersion> getFiles(String fileNameFilter) {
        String searchFilter = '%'+ fileNameFilter + '%';
        return String.isBlank(fileNameFilter) ? 
        [SELECT Id, Title, FileExtension, VersionData FROM ContentVersion 
            WHERE FileExtension = 'txt' OR FileExtension = 'pdf' OR FileExtension = 'docx' OR FileExtension = 'pptx'] : 
        [SELECT Id, Title, FileExtension, VersionData FROM ContentVersion
            WHERE (FileExtension = 'txt' OR FileExtension = 'pdf' OR FileExtension = 'docx' OR FileExtension = 'pptx') 
            AND Title LIKE: searchFilter];
    }

    @AuraEnabled
    public static ContentVersionWrapper getSingleFile(String title, String extension){
        ContentVersion document = [SELECT Id, Title, FileExtension, VersionData FROM ContentVersion WHERE Title =: title AND FileExtension =: extension LIMIT 1];
        Blob contentBody = document.VersionData;
        String documentAsString = contentBody.toString();
        ContentVersionWrapper obj = new ContentVersionWrapper(document.Title, document.FileExtension, documentAsString);

        return obj;
    }

    @AuraEnabled
    public static String getFileVersionData(String id) {
        //TODO: Avoid hardcoded Access token and url, UserInfo.getSessionId() does not work properly.
        String endpoint = 'https://vass-internship-dev-ed.develop.my.salesforce.com/services/data/v61.0/sobjects/ContentVersion/'+ id +'/VersionData';
        //String endpoint = 'callout:ContentVersionCallout/'+ id +'/VersionData';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        //req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
        req.setHeader('Authorization', 'Bearer ' +
        '00DWy000000K5TN!AQEAQFMnMb.6e12E97uU5E9kRyoUdKW3HM8pTf76gjUd0BozLjnaGhMB_cWBe2t6V_dkI2EwAWgDWh.WuojyGRQGwsRy96S2');
       
        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            return res.getBody();
        } else {
            System.debug('HTTP response status: ' + res.getStatusCode() + ' ' + res.getStatus());
            return 'Error. Invalid Session Id' + res.getStatusCode() + ' '  + UserInfo.getSessionId();
        }
    }

    public class ContentVersionWrapper {
        public ContentVersionWrapper(String title, String fileExtension, String versionData) {
            this.Title = title;
            this.FileExtension = fileExtension;
            this.VersionData = versionData;
        }
    
        public String Title { get; set; }
        public String FileExtension { get; set; }
        public String VersionData { get; set; }
    }
}