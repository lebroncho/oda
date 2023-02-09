<?php
header("Access-Control-Allow-Origin: *");

require_once(get_cfg_var('doc_root')."/ConnectPHP/Connect_init.php");
initConnectAPI("api_integration","H@%ttd9945HQ");

use RightNow\Connect\v1_3 as RNCPHP;

$input = file_get_contents('php://input');
$data = json_decode($input);

$contactId = intval($data->c_id);
$orderNumber = trim($data->order_number);
$serialNumber = trim($data->serial_number);
$productNumber = trim($data->product_number);
// 20201110 robert.surujbhan@oracle.com removed file attachment logic
//$fileData = trim($data->file_data);
$caseSubject = trim($data->case_subject);
$placeOfPurchase = trim($data->place_of_purchase);
$description = trim($data->description);
$chatSessionId = trim($data->chat_session_id);
$rmaTypeId = trim($data->rma_type);
// 20201201 robert.surujbhan@oracle.com added file attachment logic for DA-as-Agent flow via Embedded Chat Inlay
// file attachment
$fileLocalFname = trim($data->file_local_fname);
$fileUserFname = trim($data->file_user_fname);
$fileContentType = trim($data->file_content_type);

$region = trim($data->region);
$type = trim($data->type);


// DEBUG
// function getCurrentTime() {
//     $currtime = time();
//     return date("Y-m-d H:i:s",$currtime);
// }
// $mm = new RNCPHP\MailMessage();
// $mm->To->EmailAddresses = array("robert.surujbhan@oracle.com");
// $mm->Subject = "odarmabotprocessor". " @ " . getCurrentTime();
// $mm->Body->Text = $input;
// $mm->Options->IncludeOECustomHeaders = false;
// $mm->Options->HonorMarketingOptIn = false;
// $mm->send();
// DEBUG

// tst1: 105274
// prod: 106257
//$reportId = 105274;
$reportId = 106257;

function findProduct($productCode) {
    $productQuery = "ID > 0";
    $productQuery .= " AND product_code = '$productCode'";
    $productQuery .= " AND end_of_life = 0";
    $productQuery .= " AND is_active = 1";
    return RNCPHP\CO\Products::first($productQuery);
}

function findRMAType($id) {
    $typeQuery = "ID=".$id;
    return RNCPHP\CO\RMA_Type::first($typeQuery);
}

function addMessageToIncidentThread(&$p_incident, $idx, $p_text, $p_type, $c_type = 1) {
    // add new message thread to incident
    // if (!isset($incident->Threads)) {
    //     $p_incident->Threads = new RNCPHP\ThreadArray();
    // }
    $p_incident->Threads[$idx] = new RNCPHP\Thread();
    $p_incident->Threads[$idx]->EntryType = new RNCPHP\NamedIDOptList();
    $p_incident->Threads[$idx]->EntryType->ID = $p_type;
    $p_incident->Threads[$idx]->ContentType = new RNCPHP\NamedIDOptList();
    $p_incident->Threads[$idx]->ContentType->ID = $c_type; //1=text,2=html
    $p_incident->Threads[$idx]->Text = $p_text;
}

function respond($respData) {
    $_json = json_encode($respData);
    header("Content-Type: application/json; charset=UTF-8");
    header("Content-Length: " . strlen($_json));
    header("X-Content-Type-Options: nosniff");
    echo $_json;
}

function runAnalyticsReport($sessionId) {
    global $reportId;
    $sessionIdFilterOperator = new RNCPHP\NamedIDOptList;
    $sessionIdFilterOperator->Id = "1"; //Equal:=
    $sessionIdFilter = new RNCPHP\AnalyticsReportSearchFilter;
    $sessionIdFilter->Name = "sessionId";
    $sessionIdFilter->Values = array($sessionId);
    $sessionIdFilter->Operator = $sessionIdFilterOperator;
    $reportFilters = new RNCPHP\AnalyticsReportSearchFilterArray;
    $reportFilters[] = $sessionIdFilter;
    $ar = RNCPHP\AnalyticsReport::fetch($reportId);
    return $ar->run(0, $reportFilters);
}

function buildChatTranscript($sessionId) {
    $reportResults = runAnalyticsReport($sessionId);
    $nrows = $reportResults->count();
    //column headings
    $row = $reportResults->next();
    // int max chat id
    $chatId = 0;
    $transcript = "";
    for ($i = 0; $i++ < $nrows; $row = $reportResults->next()) {
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

function getRegion($region) {
    $regionObject = null;

    switch ($region) {
        case 'AP':
            $regionObject = RNCPHP\CO\Region::fetch(734);
            break;
        case 'EU':
            $regionObject = RNCPHP\CO\Region::fetch(733);
            break;
        default:        //Americas
            $regionObject = RNCPHP\CO\Region::fetch(732);
    }

    return $regionObject;
}

function getQueue($region) {
    $queue = null;

    switch ($region) {
        case 'AP':
            $queue = 307;
            break;
        case 'EU':
            $queue = 308;
            break;
        default:        //Americas
            $queue = 176;
    }

    return $queue;
}

function getRmaProductTo($typeId) {
    $returnId = ($typeId == 860) ? 2 : 1;   //To Razer : To Customer

    return RNCPHP\CO\Return_Product_To::fetch($returnId);
}

function getIncidentType($type) {
    $typeId = null;

    switch ($type) {
        case 'system':
            $typeId = 147;
            break;
        case 'peripheral':
            $typeId = 148;
            break;
        default:        //Americas
            $typeId = 157;
    }

    return $typeId;
}

//function getType($type) {
//    $typeId = null;
//
//    switch ($type) {
//        case 'system':
//            $typeId = 147;
//            break;
//        case 'peripheral':
//            $typeId = 148;
//            break;
//        default:        //Customer Service
//            $typeId = 157;
//    }
//
//    return $typeId;
//}

$result = array();

try {

    $contact = RNCPHP\Contact::fetch($contactId, RNCPHP\RNObject::VALIDATE_KEYS_OFF);

    $incident = new RNCPHP\Incident;
    $incident->PrimaryContact = $contact;
    $incident->Subject = $caseSubject;

    $incident->Threads = new RNCPHP\ThreadArray();

    // first idx=0, type=3 for cust entry
    addMessageToIncidentThread($incident, 0, $description, 3);

    $noteText = sprintf("+ Case Contact ID %d\n", $contact->ID);

    /**
     * Case ICFs
     */
    // serial number, set to uppercase
    $serialNumber = strtoupper($serialNumber);
    if (!empty($serialNumber)) {
        // SysAttrib Length of Field=20
        $serialNumber = (strlen($serialNumber) > 20) ? substr($serialNumber, 0, 20) : $serialNumber;
        $incident->CustomFields->CO1->serial_num = $serialNumber;
    }

    // store order #
    if (!empty($orderNumber)) {
        // ICF Size of Field=20
        $orderNumber = (strlen($orderNumber) > 20) ? substr($orderNumber, 0, 20) : $orderNumber;
        $incident->CustomFields->c->web_store_order_num = $orderNumber;
    }

    // 20201110 robert.surujbhan@oracle.com removed file attachment logic
    // 20201201 robert.surujbhan@oracle.com added file attachment logic for DA-as-Agent flow via Embedded Chat Inlay
    if (!empty($fileLocalFname)) {
        // file path in /tmp directory
        $fullFilePath = sprintf("/tmp/%s", $fileLocalFname);

        $incident->FileAttachments = new RNCPHP\FileAttachmentIncidentArray();

        $file1 = new RNCPHP\FileAttachmentIncident();

        $file1->setFile($fullFilePath);

        $file1->FileName = $fileUserFname;
        $file1->ContentType = $fileContentType;
        $file1->Description = "End-user POP uploaded via ODA";
        $file1->Private = false;

        $incident->FileAttachments[] = $file1;
    }

    // $incident->FileAttachments = new RNCPHP\FileAttachmentIncidentArray();
    // list($typeData, $base64data) = explode(';', $fileData);
    // //echo $base64data; //base64,AAAFBfj42Pj4
    // list(, $imgRawData) = explode(',', $base64data);
    // //echo $typeData; //data:image/png
    // list(, $mimeType) = explode(':', $typeData);
    // //echo $mimeType;
    // list($imageText, $imageExt) = explode('/', $mimeType);

    // $pos = strpos($imageExt, "*");

    // $file1Name = "userFile1";
    // $file1FileName = ($pos === false) ? "userFile1.".$imageExt : "userFile1.png";
    // $file1 = new RNCPHP\FileAttachmentIncident();
    // $file1->ContentType = ($pos === false) ? strval($mimeType) : "image/png";
    // $file1->FileName = $file1FileName;
    // $file1->Name = $file1Name;
    // $file1->Description = "End-user POP uploaded via ODA";
    // $file1->Private = false;
    // $fp = $file1->makeFile();
    // fwrite($fp, base64_decode($imgRawData));
    // fclose($fp);
    // $incident->FileAttachments[] = $file1;

    // manual queue override
    // $incident->Queue = new RNCPHP\NamedIDLabel();
    // $incident->Queue->ID = 176;

    // moves record to InProcess rule state
    $incident->save();

    $result = array("status" => "OK", "id" => $incident->ID, "refNo" => $incident->ReferenceNumber);

    /**
     * CO.RMA record logic
     */

    // CO.Products lookup for product SKU
    $product = null;
    $productCode = strtoupper($productNumber);
    if (!empty($productCode)) {
        $product = findProduct($productCode);
    }

    // CO.RMA_Type menu item lookup
    $rmaTypeId = intval($rmaTypeId);
    $rmaType = findRMAType($rmaTypeId);
    // init creation flag - used to determine if trans mailing receipt should be sent later
    $rmaCreated = false;
    if(!is_null($rmaType) && is_object($rmaType)) {
        // CO.RMA object
        $rma = new RNCPHP\CO\RMA();
        $rma->incident_id = $incident;
        //$rma->rma_type = RNCPHP\CO\RMA_Type::fetch(861); //Replace Once Received
        //$rma->rma_type = RNCPHP\CO\RMA_Type::fetch($rmaTypeId, RNCPHP\RNObject::VALIDATE_KEYS_OFF);
        $rma->rma_type = $rmaType;
        // $rma->reason = RNCPHP\CO\Reason::fetch(1028); //Repair - Defective ��� OOW
        $rma->region = getRegion($region); //todo: edit
        $rma->return_product_to = getRmaProductTo($rmaTypeId);
        // $rma->payment = RNCPHP\CO\Payment::fetch(1); //OOW
        $rma->contact_id = $contact;
        $rma->problem_description = $description;
        $rma->rma_status = RNCPHP\CO\RMA_Status::fetch(836); // CO$RMA_Status, 836 = RMA Review, 835 = Open
        if (!empty($placeOfPurchase)) {
            //Length of Field=85
            $placeOfPurchase = (strlen($placeOfPurchase) > 85) ? substr($placeOfPurchase, 0, 85) : $placeOfPurchase;
            $rma->place_of_purchase = $placeOfPurchase;
        }
        if (!is_null($product) && is_object($product)) {
            $rma->product = $product;
            $incident->CustomFields->CO->Products1 = $product;
            $noteText .= sprintf("+ CO.Products matched ID %d\n", $product->ID);
        }
        $rma->save();
        // commit to DB to make sure RMA number is generated via Generate_rma_number CPM handler
        RNCPHP\ConnectAPI::commit();
        $noteText .= sprintf("+ New RMA created with ID %d\n", $rma->ID);
        if ($rma->ID > 1) {
            $rmaCreated = true;
        }
    }
    else {
        $noteText .= sprintf("- RMA creation failed. Invalid RMA Type ID: %d\n", $rmaTypeId);
    }

    // second idx=1, type=1 for private note
    addMessageToIncidentThread($incident, 1, $noteText, 1);

    if (!empty($chatSessionId)) {
        $chatTranscript = buildChatTranscript($chatSessionId);
        if (!empty($chatTranscript)) {
            addMessageToIncidentThread($incident, 2, $chatTranscript, 5, 2); //html
        }
    }

    $incident->Queue = new RNCPHP\NamedIDLabel();
    $incident->Queue->ID = getQueue($region);

//    $incident->CustomFields->c->incident_source = new RNCPHP\NamedIDLabel();
//    $incident->CustomFields->c->incident_source->ID = 163;     //Chat Bot

    $incident->CustomFields->c->incident_type = new RNCPHP\NamedIDLabel();
    $incident->CustomFields->c->incident_type->id = ($type == 'system') ? 147 : 148;

    // incident save
    // avoid running InProcess state rules again
    $incident->save(RNCPHP\RNObject::SuppressAll);
    //$incident->save();

    // send email receipt via transactional mailing
    $mailingId = RNCPHP\Configuration::fetch("CUSTOM_CFG_RMA_BOT_CPM_MAILING_ID_CUST_RECEIPT")->Value;
    $mailingId = intval($mailingId);
    // check to make sure RMA was created and the mailing ID config is not at a Default value (0 or 1)
    if ($rmaCreated == true && $mailingId > 1) {
        RNCPHP\Mailing::SendMailingToContact($contact, $incident, $mailingId, 0);
    }
}

catch (\Exception $e) {
    $result = array("status" => "Failed", "exception" => $e->getMessage());
}

respond($result);
?>
