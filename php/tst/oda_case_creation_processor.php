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

function getContactReason($productID, $issue = null){
    $contactReason = null;
    $order = [9, 35, 73];
    $rma = [90, 88, 98, 101];
  
    if (in_array($productID, $order)) {
        $contactReason = 6;
    } else if (in_array($productID, $order)) {
      $contactReason = 6;
    } else if (in_array($productID, $rma)) {
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

function getIncidentType($productID){
  $typeID = null;
  $software = [1284, 567, 671, 1323, 1585, 663, 1268, 1341];
  $mobile = [284, 2003];
  $networking = [129];
  $peripherals = [1220, 856, 891, 932, 691, 725, 916, 1073, 1609, 1035, 101, 2494];
  $system = [281, 1827, 277, 88, 2678];

  if (in_array($productID, $software)) {
    $typeID = 149;
  } else if (in_array($productID, $mobile)) {
    $typeID = 155;
  } else if (in_array($productID, $networking)) {
    $typeID = 159;
  } else if (in_array($productID, $peripherals)) {
    $typeID = 148;
  } else if (in_array($productID, $system)) {
    $typeID = 147;
  } else {
    $typeID = 157;
  }

  return $typeID;
}

function getWebIncidentType($productID){
    $typeID = null;
    $software = [1284, 567, 671, 1323, 1585, 663, 1268, 1341];
    $mobile = [284];
    $networking = [129];
    $peripherals = [856, 891, 932, 691, 725, 916, 1073, 1609, 2003, 1035, 101, 2494];
    $laptop = [281];
    $desktop = [1827, 1220, 277, 88, 2678];

    if (in_array($productID, $software)) {
        $typeID = 425;  // My Razer Software
    } else if (in_array($productID, $mobile)) {
        $typeID = 420;  // My Razer Phone
    } else if (in_array($productID, $networking)) {
        $typeID = 419;  // My Razer Network & Monitor
    } else if (in_array($productID, $peripherals)) {
        $typeID = 413;  // My Peripheral (mouse, keyboard, headset)
    } else if (in_array($productID, $laptop)) {
        $typeID = 418;  // My Razer Laptop
    } else if (in_array($productID, $desktop)) {
        $typeID = 431;  // My Razer Desktop & Components
    } else {
        $typeID = 410;  // My Order from Razer.com
    }

    return $typeID;
}

function getCountry($region){
    $region = strtoupper($region);
    return $region == 'NA' ? 'us' : NULL;
}

function getRegion($region){
    $regionID = NULL;
    $region = strtoupper($region);

    switch ($region) {
        case 'AP':
        case 'ODAAP':
            $regionID = 734;
            break;
        case 'EU':
        case 'ODAEU':
            $regionID = 733;
            break;
        default: //Americas
            $regionID = 732;
    }

    return $regionID;
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

    // note = ['content' => 'sample', 'id' => 'troubleshooting', 'entryType' => 'private-note', 'contentType': 'text']
    // file = ['name' => 'sample', 'path' => '/tmp', 'contentType': '']
    $caseData = [
        "region" => $payloadData['region'], "chatSessionID" => $payloadData['chatSessionID'],
        "contactID" => $payloadData['contactID'], "orderNumber" => $payloadData['orderNumber'],
        "serialNumber" => $payloadData['serialNumber'], "categoryID" => $payloadData['categoryID'],
        "subject" => $payloadData['subject'],
        "productNumber" => $payloadData['productNumber'],
        "productDescription" => $payloadData['productDescription'],
        "productID" => $payloadData['productID'], "issue" => $payloadData['issue'],
        "rmaNumber" => $payloadData['rmaNumber'], "payRepairFeeID" => $payloadData['payRepairFeeID'],
        "country" => $payloadData['country'],
        "files" => $payloadData['files'], "notes" => $payloadData['notes']
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
    $chatID = 0; // int max chat id
    $transcript = "";

    for ($i = 0; $i++ < $nrows; $row = $analyticsReportResults->next()) {
      // print_r($row);
      // format
      // [TIMESTAMP] <ROLE>: MESSAGE
      // set chat ID to most recent
      if ($i == 1) {
        $chatID = intval($row['Chat ID']);
      }
      // if not the most recent chat for the session, do not include in transcript block
      if ($chatID == intval($row['Chat ID'])) {
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

function createServiceCategory($categoryID){
    $serviceCategory = NULL;
    if ($categoryID != NULL && $categoryID != '' && $categoryID != '<not set>') {   // include <not set> as blank value case
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

function createServiceProduct($productID){
    $productID = intval($productID);
    $serviceProduct = RNCPHP\ServiceProduct::fetch($productID);
    return $serviceProduct;
}

function createContactReason($productID, $issue){
    $productID = intval($productID);
    $contactReasonID = getContactReason($productID, $issue);
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

function assignTypeAndSourceToIncident($incident, $productID, $source){
    $productID = intval($productID);

    $incident->CustomFields->c->incident_type = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->incident_type->id = getIncidentType($productID);

    $incident->CustomFields->c->web_incident_type = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->web_incident_type->id = getWebIncidentType($productID);

    $incident->CustomFields->c->incident_source = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->incident_source->id = $source;
}

function assignSourceCountryAndRegion($incident, $country, $region){
    // Default web_country value for skills without country in their payload
    if(empty($country) || $country == ''){
        $country = 'us';
    }

    $incident->CustomFields->c->web_country = $country;

    $incident->CustomFields->c->region = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->region->id = getRegion($region);

    $incident->CustomFields->c->chat_region = $region;
}

function mapProductNumberAndDescription($incident, $productNumber){
    $product = NULL;
    $productNumber = strval($productNumber);
    if($productNumber != NULL && !empty($productNumber)){
        $productNumber = strtoupper($productNumber);
        $product = findProduct($productNumber);
    }
    $incident->CustomFields->CO->Products1 = $product;
}

function setRazerCareInfo($incident, $payRepairFeeID)
{
    $payRepairFeeID = intval($payRepairFeeID);
    if ($payRepairFeeID != 0) {
        // Sets RazerCare coverage to Yes if pay repair fee is set to Razer Care (472)
        $incident->CustomFields->CO1->razercare_purchased = ($payRepairFeeID == 472) ? true : false;

        $incident->CustomFields->c->pay_repair_fee = new RNCPHP\NamedIDLabel();
        $incident->CustomFields->c->pay_repair_fee->id = $payRepairFeeID;
    }
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
            $caseData['productID'], $caseData['issue']
        );
        $incident->Product = createServiceProduct($caseData['productID']);
        $incident->Category = createServiceCategory($caseData['categoryID']);
        
        // $incidentType = getIncidentType(intval($caseData['productID']));
        assignTypeAndSourceToIncident($incident, $caseData['productID'], $WEB_ODA_INCIDENT_SOURCE);
        assignOrderNumberToIncident($incident, $caseData['orderNumber']);
        assignSerialNumberToIncident($incident, $caseData['serialNumber']);
        assignSourceCountryAndRegion($incident, $caseData['country'], $caseData['region']);
        mapProductNumberAndDescription($incident, $caseData['productNumber']);
        setRazerCareInfo($incident, $caseData['payRepairFeeID']);

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
            'referenceNumber' => $incident->ReferenceNumber,
            'payRepairFeeID' => $caseData['payRepairFeeID'],
            'country' => $caseData['country']
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