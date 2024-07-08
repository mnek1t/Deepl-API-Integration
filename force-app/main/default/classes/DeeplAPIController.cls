public with sharing class DeeplAPIController {
    private static final String URL = 'https://api-free.deepl.com/v2';
    @AuraEnabled
    public static List<Object> getSupportedLaguages(){
        Http h = new Http();
        HttpRequest request = buildRequest('/languages?type=source', 'GET');
        HttpResponse response = h.send(request);
        List<Object> jsonResponse = (List<Object>)JSON.deserializeUntyped(response.getBody());
        return jsonResponse;
    }

    @AuraEnabled
    public static Map<String,Object> translateText(String text, String targetLang, String sourceLang, String formality){
        Http h = new Http();
        HttpRequest request = buildRequest('/translate', 'POST');
        request.setHeader('Content-Type', 'application/json');
        Map<String, Object> requestBodyMap = new Map<String, Object>();
        requestBodyMap.put('text', new List<String> { text });
        requestBodyMap.put('target_lang', targetLang);
        requestBodyMap.put('source_lang', sourceLang);
        requestBodyMap.put('preserve_formatting', true);
        requestBodyMap.put('formality', formality);
        requestBodyMap.put('tag_handling', 'html');
        String requestBody = JSON.serialize(requestBodyMap);
        request.setBody(requestBody);
        HttpResponse response = h.send(request);
        Map<String,Object> jsonResponse = (Map<String,Object>)JSON.deserializeUntyped(response.getBody());
        return jsonResponse;
    }

    @AuraEnabled
    public static Map<String,Object> translateDocument(String documentContent, String sourceLang, String targetLang, String formality, String fileName){
        Http h = new Http();
        HttpRequest request = buildRequest('/document', 'POST');
        String boundary = '----WebKitFormBoundary' + Blob.valueOf(String.valueOf(DateTime.now().getTime())).toString();
        String lineEnd = '\r\n';
        String twoHyphens = '--';
      
        String body = twoHyphens + boundary + lineEnd +
                    'Content-Disposition: form-data; name="file"; filename="' + fileName + '"' + lineEnd +
                    'Content-Type: application/octet-stream' + lineEnd + lineEnd +
                    documentContent + lineEnd +
                    twoHyphens + boundary + lineEnd +
                    'Content-Disposition: form-data; name="target_lang"' + lineEnd + lineEnd +
                    targetLang + lineEnd +
                    twoHyphens + boundary + lineEnd +
                    'Content-Disposition: form-data; name="source_lang"' + lineEnd + lineEnd +
                    sourceLang + lineEnd +
                    twoHyphens + boundary + lineEnd +
                    'Content-Disposition: form-data; name="formality"' + lineEnd + lineEnd +
                    formality + lineEnd +
                    twoHyphens + boundary + twoHyphens;
        request.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
        request.setBodyAsBlob(Blob.valueOf(body));
        HttpResponse response = h.send(request);
        Map<String,Object> jsonResponse = (Map<String,Object>)JSON.deserializeUntyped(response.getBody());
        return jsonResponse;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String,Object> checkDocumentStatus(String documentId, String documentKey){
        Http h = new Http();
        String query = '/document/' + documentId;
        HttpRequest request = buildRequest(query, 'POST');
        request.setHeader('Content-Type', 'application/json');
        Map<String, Object> requestBodyMap = new Map<String, Object>();
        requestBodyMap.put('document_key', documentKey);
        String requestBody = JSON.serialize(requestBodyMap);
        request.setBody(requestBody);
        HttpResponse response = h.send(request);
        Map<String,Object> jsonResponse = (Map<String,Object>)JSON.deserializeUntyped(response.getBody());
        return jsonResponse;     
    }

    @AuraEnabled
    public static String downloadTranslatedDocument(String documentId, String documentKey) {
        try {
            Http http = new Http();
            String query = '/document/' + documentId + '/result';
            HttpRequest request = buildRequest(query, 'POST');
            request.setHeader('Content-Type', 'application/json');
            Map<String, Object> requestBodyMap = new Map<String, Object>();
            requestBodyMap.put('document_key', documentKey);
            String requestBody = JSON.serialize(requestBodyMap);
            request.setBody(requestBody);
            HttpResponse res = http.send(request);
        
            if (res.getStatusCode() == 200) {
                //Blob responseBody = res.getBodyAsBlob();
                //String base64ResponseBody = EncodingUtil.base64Encode(responseBody);
                String responseBody = res.getBody();
                return responseBody;
                //return base64ResponseBody;
            } else {
                System.debug('DeepL API callout failed: ' + res.getStatus());
                return 'Error translating content' + res;
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error translating content');
        }
    }

    //TODO: Avoid hardcoding key
    private static HttpRequest buildRequest(String query, String methodType) {
        HttpRequest request = new HttpRequest();
        request.setEndpoint(URL + query);
        request.setMethod(methodType);
        request.setHeader('Accept', 'application/json');
        request.setHeader('Authorization', 'DeepL-Auth-Key 5839e3c1-4c3f-4665-bed7-4a849d86b9e4:fx');
        return request;
    }
}