<?php
require_once(get_cfg_var('doc_root') . "/ConnectPHP/Connect_init.php");
use RightNow\Connect\v1_3 as RNCPHP;

header("Access-Control-Allow-Origin: *");
initConnectAPI("api_integration", "H@%ttd9945HQ");

// tst1: 105274 ; prod: 106257
const REPORTID = 106257;

const ENTRY_TYPE_MAPPING = [
    'private-note' => MessageEntryType::PRIVATE_NOTE,
    'custom' => MessageEntryType::CUSTOM,
    'chat' => MessageEntryType::CHAT
];
const CONTENT_TYPE_MAPPING = [
    'text' => MessageContentType::TEXT,
    'html' => MessageContentType::HTML
];

/**********************************************************/
/**************** LEGACY CODES START *********************/

function getContactReason($problemID, $issue = null){
    $contactReason = null;
    $order = [9, 35, 73];
    $rma = [90, 88, 98, 101];
  
    if ($problemID == 932) {
      if ($issue == 'General Product Questions') {
        $contactReason = 3;
      } else {
        $contactReason = 7;
      }
    } else if (in_array($problemID, $order)) {
      $contactReason = 6;
    } else if (in_array($problemID, $rma)) {
      $contactReason = 8;
    } else {
      $contactReason = 3;
    }
  
    return $contactReason;
}

function findProduct($productNumber){
  $productQuery = "ID > 0";
  $productQuery .= " AND product_code = '$productNumber'";
  $productQuery .= " AND end_of_life = 0";
  $productQuery .= " AND is_active = 1";

  return RNCPHP\CO\Products::first($productQuery);
}

function getIncidentType($problemID){
  $typeId = null;
  $software = [1284, 567, 671, 1323, 1585, 663, 1268, 1341];
  $mobile = [284, 2003];
  $networking = [129];
  $peripherals = [1220, 856, 891, 932, 691, 725, 916, 1073, 129, 1609, 1035, 101, 2494];
  $system = [281, 1827, 277, 88, 2678];

  if (in_array($problemID, $software)) {
    $typeID = 149;
  } else if (in_array($problemID, $mobile)) {
    $typeID = 155;
  } else if (in_array($problemID, $networking)) {
    $typeID = 159;
  } else if (in_array($problemID, $peripherals)) {
    $typeID = 148;
  } else if (in_array($problemID, $system)) {
    $typeID = 147;
  } else {
    $typeID = 157;
  }

  return $typeID;
}

function getCountry($region){
    $region = strtoupper($region);
    return $region == 'NA' ? 'us' : NULL;
}

function getRegion($region){
    $regionObject = NULL;
    $regionId = NULL;
    $region = strtoupper($region);

    switch ($region) {
        case 'AP':
            $regionObject = RNCPHP\CO\Region::fetch(734);
            $regionId = 734;
            break;
        case 'EU':
            $regionObject = RNCPHP\CO\Region::fetch(733);
            $regionId = 733;
            break;
        default: //Americas
            $regionObject = RNCPHP\CO\Region::fetch(732);
            $regionId = 732;
    }

    return $regionId;
}

/**************** LEGACY CODES END *********************/
/*******************************************************/

/** Emulate enums since it is not supported on older PHP versions */
class MessageEntryType{

    const PRIVATE_NOTE = 1;
    const CUSTOM = 3;
    const CHAT = 5;
}

class MessageContentType{

    const TEXT = 1;
    const HTML = 2;
}

function parseCaseDataFromPayload($input){
    $payloadData = json_decode($input, true);

    // note = ['content' => 'sample', 'id' => 'troubleshooting', 'entry_type' => 'private-note', 'content_type': 'text']
    // file = ['name' => 'sample', 'path' => '/tmp', 'content_type': '']
    $caseData = [
        "region" => $payloadData['region'], "chatSessionID" => $payloadData['chatSessionID'],
        "contactID" => $payloadData['contactID'], "orderNumber" => $payloadData['orderNumber'],
        "serialNumber" => $payloadData['serialNumber'], "categoryID" => $payloadData['categoryID'],
        "subject" => $payloadData['subject'], "productNumber" => $payloadData['productNumber'],
        "problemID" => $payloadData['problemID'], "issue" => $payloadData['issue'],
        "rmaNumber" => $payloadData['rmaNumber'], "files" => $payloadData['files'],
        "notes" => $payloadData['notes']
    ];

    return $caseData;
}

function sanitizeCaseData($caseData){
    // DO SOME SANITATION, CHECKING, FORMATTING AND ETC.

    return $caseData;
}

function getAnalyticsReportResults($sessionID, $reportID){

    $sessionIDFilterOperator = new RNCPHP\NamedIDOptList;
    $sessionIDFilterOperator->Id = "1"; //Equal:=
    
    $sessionIDFilter = new RNCPHP\AnalyticsReportSearchFilter;
    $sessionIDFilter->Name = "sessionId";
    $sessionIDFilter->Values = array($sessionID);
    $sessionIDFilter->Operator = $sessionIDFilterOperator;

    $reportFilters = new RNCPHP\AnalyticsReportSearchFilterArray;
    $reportFilters[] = $sessionIDFilter;

    $analyticsReport = RNCPHP\AnalyticsReport::fetch($reportID);
    $results = $analyticsReport->run(0, $reportFilters);

    return $results;
}

function buildChatTranscript($analyticsReportResults){
    $nrows = $analyticsReportResults->count();
    $row = $analyticsReportResults->next(); //skip column headings
    $chatId = 0; // int max chat id
    $transcript = "";

    for ($i = 0; $i++ < $nrows; $row = $analyticsReportResults->next()) {
      // print_r($row);
      // format
      // [TIMESTAMP] <ROLE>: MESSAGE
      // set chat ID to most recent
      if ($i == 1) {
        $chatId = intval($row['Chat ID']);
      }
      // if not the most recent chat for the session, do not include in transcript block
      if ($chatId == intval($row['Chat ID'])) {
        $role = $row['Role in Conversation'] == "Lead" ? "Bot" : $row['Contact Name'];
        $transcript .= sprintf("[%s] %s: %s<br/>", $row['Date of Event'], $role, $row['Data String']);
      }
    }
    return $transcript;
}

function createContact($contactID){
    $validateKeysOff = RNCPHP\RNObject::VALIDATE_KEYS_OFF;
    $contact = RNCPHP\Contact::fetch($contactID, $validateKeysOff);
    return $contact;
}

function createServiceCategory($problemID, $categoryID){
    $serviceCategory = NULL;
    if ($problemID == 1341 && $categoryID != 'NULL') { //Surround Sound Activation
        $serviceCategory = RNCPHP\ServiceCategory::fetch(intval($categoryID));
    }
    return $serviceCategory;
}

function assignOrderNumberToIncident($incident, $orderNumber){
    if ($orderNumber != NULL && !empty($orderNumber) && $orderNumber != 'null') {
        $orderNumber = (strlen($orderNumber) > 20) ? substr($orderNumber, 0, 20) : $orderNumber;
        $incident->CustomFields->CO1->order_number = $orderNumber;
        $incident->CustomFields->c->web_store_order_num = $orderNumber;
    }
}

function createServiceProduct($problemID){
    $problemID = intval($problemID);
    $serviceProduct = RNCPHP\ServiceProduct::fetch($problemID);
    return $serviceProduct;
}

function createContactReason($problemID, $issue){
    $problemID = intval($problemID);
    $contactReasonID = getContactReason($problemID, $issue);
    $contactReason = RNCPHP\CO1\Contact_Reason::fetch($contactReasonID);
    return $contactReason;
}

function assignSerialNumberToIncident($incident, $serialNumber){
    // set the serial number to uppercase; SysAtrrib length of field = 20
    if($serialNumber != NULL && !empty($serialNumber)){
        $serialNumber = strtoupper($serialNumber);
        $serialNumber = (strlen($serialNumber) > 20) ? substr($serialNumber, 0, 20) : $serialNumber;
        $incident->CustomFields->CO1->serial_num = $serialNumber;
    }
}

function assignTypeAndSourceToIncident($incident, $type, $source){
    $incident->CustomFields->c->incident_type = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->incident_type->id = $type;

    $incident->CustomFields->c->incident_source = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->incident_source->id = $source;
}

function assignSourceCountryAndRegion($incident, $region){
    $incident->CustomFields->c->web_country = getCountry($region);

    $incident->CustomFields->c->region = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->region->id = getRegion($region);
}

function createMessage($content, $entryType, $contentType){
    $message = [
        'content' => $content, 'entryType' => $entryType,
        'contentType' => $contentType
    ];
    return $message;
}

function createMessageThread($message){
    $thread = new RNCPHP\Thread();
    $thread->Text = $message['content'];
    $thread->EntryType = new RNCPHP\NamedIDOptList();
    $thread->EntryType->ID = $message['entryType'];
    $thread->ContentType = new RNCPHP\NamedIDOptList();
    $thread->ContentType->ID = $message['contentType'];

    return $thread;
}

function createMessageThreads($messages){
    $messageThreads = [];
    foreach($messages as $message){
        $messageThread = createMessageThread($message);
        $messageThreads[] = $messageThread;
    }
    return $messageThreads;
}

function assignMessageThreadToIncident($incident, $index, $messageThread){
    $incident->Threads[$index] = $messageThread;
}

function assignMessageThreadsToIncident($incident, $startingIndex, $messageThreads){
    $count = 0;
    foreach($messageThreads as $messageThread){
        assignMessageThreadToIncident($incident, $startingIndex, $messageThread);
        $startingIndex++; $count++;
    }
    return $count;
}

function createMessageFromNote($note){
    $message = createMessage(
        $note['content'], ENTRY_TYPE_MAPPING[$note['entryType']],
        CONTENT_TYPE_MAPPING[$note['contentType']]
    );
    return $message;
}

function createMessageFromNotes($notes){
    $messages = [];
    foreach($notes as $note){
        $messages[] = createMessageFromNote($note);
    }
    return $messages;
}

function createFileAttachmentIncident($file){
    $path = sprintf("/tmp/%s", $file['path']);

    $fileAttachmentIncident = new RNCPHP\FileAttachmentIncident();
    $fileAttachmentIncident->setFile($path);
    $fileAttachmentIncident->FileName = $file['name'];
    $fileAttachmentIncident->ContentType = $file['contentType'];

    $description = isset($file['description']) ? $file['description'] : 'End-user POP uploaded via ODA';
    $fileAttachmentIncident->Description = $description;
    $fileAttachmentIncident->Private = false;

    return $fileAttachmentIncident;
}

function createFileAttachmentIncidents($files){
    $fileAttachmentIncidents = [];

    foreach($files as $file){
        $fileAttachmentIncident = createFileAttachmentIncident($file);
        $fileAttachmentIncidents[] = $fileAttachmentIncident;
    }
    return $fileAttachmentIncidents;
}

function appendFileAttachmentIncidentToFileAttachmentIncidentArray($incidentArray, $fileAttachmentIncidents){
    foreach($fileAttachmentIncidents as $fileAttachmentIncident){
        $incidentArray[] = $fileAttachmentIncident;
    }
}

function respond($payloadData){
    $payloadJSON = json_encode($payloadData);
    
    header("Content-Type: application/json; charset=UTF-8");
    header("Content-Length: " . strlen($payloadJSON));
    header("X-Content-Type-Options: nosniff");
  
    echo $payloadJSON;
}

function sendEmail($subject, $content, $recipients){
    $mailMessage = new RNCPHP\MailMessage();
    $mailMessage->To->EmailAddresses = $recipients;
    $mailMessage->Subject = $subject;
    $mailMessage->Body->Text = $content;
    $mailMessage->Options->IncludeOECustomHeaders = false;
    $mailMessage->Options->HonorMarketingOptIn = false;

    $mailMessage->send();
}


function main(){
    $payloadData = [];
    $RECIPIENTS = ['darwin.sardual.ext@razer.com','josh.cabiles.ext@razer.com'];

    try{
        
        $WEB_ODA_INCIDENT_SOURCE = 346;
        $input = file_get_contents('php://input');
        $threadIndex = 0;
        $defaultMessages = [];

        $caseData = parseCaseDataFromPayload($input);
        $caseData = sanitizeCaseData($caseData);

        $incident = new RNCPHP\Incident;
        $incident->Subject = $caseData['subject'];

        $incident->PrimaryContact = createContact($caseData['contactID']);
        $incident->CustomFields->CO1->contact_reason = createContactReason(
            $caseData['problemID'], $caseData['issue']
        );
        $incident->Product = createServiceProduct($caseData['problemID']);
        $incident->Category = createServiceCategory($caseData['problemID'], $caseData['categoryID']);
        
        $incidentType = getIncidentType(intval($caseData['problemID']));
        assignTypeAndSourceToIncident($incident, $incidentType, $WEB_ODA_INCIDENT_SOURCE);
        assignOrderNumberToIncident($incident, $caseData['orderNumber']);
        assignSerialNumberToIncident($incident, $caseData['serialNumber']);
        assignSourceCountryAndRegion($incident, $caseData['region']);
        
        /** NOTE: Not really sure if this is still useful */
        $product = NULL;
        $productNumber = $caseData['productNumber'];
        if($productNumber != NULL && !empty($productNumber)){
            $productNumber = strtoupper($productNumber);
            $product = findProduct($productNumber);
        }
        /********************************************* */


        /** ADD MESSAGES START */
        $message = createMessage($caseData['issue'], MessageEntryType::CUSTOM, MessageContentType::TEXT);
        $defaultMessages[] = $message;

        $contactText = sprintf("+ Case Contact ID %d\n", $incident->PrimaryContact->ID);
        $message = createMessage($contactText, MessageEntryType::PRIVATE_NOTE, MessageContentType::TEXT);
        $defaultMessages[] = $message;

        $rmaNumber = $caseData['rmaNumber'];
        if ($rmaNumber != NULL && $rmaNumber != 'null') {
            $rmaText = sprintf("+ RMA Number: %s\n", $rmaNumber);
            $message = createMessage($rmaText, MessageEntryType::PRIVATE_NOTE, MessageContentType::TEXT);
            $defaultMessages[] = $message;
        }

        $chatSessionID = $caseData['chatSessionID'];
        if($chatSessionID != NULL && !empty($chatSessionID)){
            $analyticsReportResults = getAnalyticsReportResults($chatSessionID, REPORTID);
            $transcript = buildChatTranscript($analyticsReportResults);

            if(!empty($transcript)){
                $message = createMessage($transcript, MessageEntryType::CHAT, MessageContentType::HTML);
                $defaultMessages[] = $message;
            }
        }

        $additionalMessages = createMessageFromNotes($caseData['notes']);
        $allMessages = array_merge($defaultMessages, $additionalMessages);

        $messageThreads = createMessageThreads($allMessages);
        $notesCount = assignMessageThreadsToIncident($incident, $threadIndex, $messageThreads);
        $threadIndex = $threadIndex + $notesCount;

        /** ADD MESSAGES END */

        /** ADD FILE ATTACHEMENTS START */
        $fileAttachmentIncidentArray = new RNCPHP\FileAttachmentIncidentArray();
        $fileAttachmentIncidents = createFileAttachmentIncidents($caseData['files']);
        appendFileAttachmentIncidentToFileAttachmentIncidentArray($fileAttachmentIncidentArray, $fileAttachmentIncidents);
        $incident->FileAttachments = $fileAttachmentIncidentArray;

        /** ADD FILE ATTACHEMENTS END */

        $incident->save();

        $payloadData = [
            'status' => 'OK', 'id' => $incident->ID,
            'referenceNumber' => $incident->ReferenceNumber
        ];

        /** NOTE: Not really sure if this is still useful */

        // send email receipt via transactional mailing
        $mailingID = RNCPHP\Configuration::fetch("CUSTOM_CFG_RMA_BOT_CPM_MAILING_ID_CUST_RECEIPT")->Value;
        $mailingID = intval($mailingID);

        // check to make sure RMA was created and the mailing ID config is not at a Default value (0 or 1)
        if ($rmaCreated == true && $mailingID > 1) {
            RNCPHP\Mailing::SendMailingToContact($incident->PrimaryContact, $incident, $mailingID, 0);
        }

        /*********************************************** */

        sendEmail('ODA Case Creation Processor', json_encode($payloadData), $RECIPIENTS);
    }catch(\Exception $e){
        $exceptionMessage = $e->getMessage();
        $payloadData = [
            'status' => 'Failed',
            'exception' => $exceptionMessage
        ];

        sendEmail('ODA Case Creation Processor', $exceptionMessage, $RECIPIENTS);
    }

    respond($payloadData);
}

main();