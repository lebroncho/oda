<?php
header("Access-Control-Allow-Origin: *");

require_once(get_cfg_var('doc_root') . "/ConnectPHP/Connect_init.php");
initConnectAPI("api_integration", "H@%ttd9945HQ");

use RightNow\Connect\v1_3 as RNCPHP;

$input = file_get_contents('php://input');
$data = json_decode($input);

$contactId = intval($data->c_id);
$caseSubject = trim($data->issue);
$problemId = trim($data->problem_id);
$categoryId = trim($data->category_id);
$rmaNumber = trim($data->rma_number);
$orderNumber = trim($data->order_number);
$serialNumber = trim($data->serial_number);
$productNumber = trim($data->product_number);
$issue = trim($data->issue);
$region = trim($data->region);
$chatSessionId = trim($data->chat_session_id);

$fileLocalFname = trim($data->file_local_fname);
$fileUserFname = trim($data->file_user_fname);
$fileContentType = trim($data->file_content_type);

$deviceSymptoms = trim($data->deviceSymptoms);
$deviceConnection = trim($data->deviceConnection);
$deviceTsSteps = trim($data->deviceTsSteps);
$deviceUpdated = trim($data->deviceUpdated);
$deviceOccurrence = trim($data->deviceOccurrence);

$rmaType = trim($data->rmaType);
$rmaPhone = trim($data->rmaPhone);
$rmaShippingAddress = trim($data->rmaShippingAddress);
$rmaBillingAddress = trim($data->rmaBillingAddress);
$rmaPurchaseDate = trim($data->rmaPurchaseDate);
$rmaPurchasePlace = trim($data->rmaPurchasePlace);
$rmaCountry = trim($data->rmaCountry);
$rmaZipPostal = trim($data->rmaZipPostal);
$rmaStateProvince = trim($data->rmaStateProvince);
$rmaCity = trim($data->rmaCity);
$rmaStreetAddress = trim($data->rmaStreetAddress);
$rmaFileLocalFname = trim($data->rmaFile);
$rmaFileUserFname = trim($data->rmaFileTitle);
$rmaFileType = trim($data->rmaFileType);

$issueDescription = trim($data->issueDescription);

// DEBUG
// function getCurrentTime() {
//     $currtime = time();
//     return date("Y-m-d H:i:s",$currtime);
// }
// $mm = new RNCPHP\MailMessage();
// $mm->To->EmailAddresses = array("herzon.tan@concentrix.com");
// $mm->Subject = "odacasebotprocessor";
// $mm->Body->Text = $rmaNumber;
// $mm->Options->IncludeOECustomHeaders = false;
// $mm->Options->HonorMarketingOptIn = false;
// $mm->send();
// DEBUG

// tst1: 105274
// prod: 106257
// $reportId = 105274;
$reportId = 106257;

function findProduct($productCode)
{
  $productQuery = "ID > 0";
  $productQuery .= " AND product_code = '$productCode'";
  $productQuery .= " AND end_of_life = 0";
  $productQuery .= " AND is_active = 1";
  return RNCPHP\CO\Products::first($productQuery);
}

function addMessageToIncidentThread(&$p_incident, $idx, $p_text, $p_type, $c_type = 1)
{
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

function respond($respData)
{
  $_json = json_encode($respData);
  header("Content-Type: application/json; charset=UTF-8");
  header("Content-Length: " . strlen($_json));
  header("X-Content-Type-Options: nosniff");
  echo $_json;
}

function runAnalyticsReport($sessionId)
{
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

function buildChatTranscript($sessionId)
{
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

function getRegion($region)
{
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

function getQueue($problemId)
{
  $queue = null;
  // $repair = [87, 97];
  $order = [9, 35, 73, 90, 98];
  $l1 = [1220, 856, 891, 932, 691, 725, 916, 1073, 129, 2003, 1035, 284, 101, 2494];
  $l15 = [281, 1827, 277, 88, 2678];
  $software = [1284, 567, 671, 1323, 1585, 663, 1268];
  $chair = [1609];

  if (in_array($problemId, $order)) {
    $queue = 84;
  } else if (in_array($problemId, $l1)) {
    $queue = 69;
  } else if (in_array($problemId, $l15)) {
    $queue = 78;
  } else if (in_array($problemId, $chair)) {
    $queue = 327;
  } else {
    $queue = 93;
  }

  return $queue;
}

function getRmaProductTo($typeId)
{
  $returnId = ($typeId == 860) ? 2 : 1;   //To Razer : To Customer

  return RNCPHP\CO\Return_Product_To::fetch($returnId);
}

function getIncidentType($problemId)
{
  $typeId = null;
  $software = [1284, 567, 671, 1323, 1585, 663, 1268, 1341];
  $mobile = [284, 2003];
  $networking = [129];
  $peripherals = [1220, 856, 891, 932, 691, 725, 916, 1073, 129, 1609, 1035, 101, 2494];
  $system = [281, 1827, 277, 88, 2678];

  if (in_array($problemId, $software)) {
    $typeId = 149;
  } else if (in_array($problemId, $mobile)) {
    $typeId = 155;
  } else if (in_array($problemId, $networking)) {
    $typeId = 159;
  } else if (in_array($problemId, $peripherals)) {
    $typeId = 148;
  } else if (in_array($problemId, $system)) {
    $typeId = 147;
  } else {
    $typeId = 157;
  }

  return $typeId;
}

function getContactReason($problemId, $issue = null)
{
  $contactReason = null;
  $order = [9, 35, 73];
  $rma = [90, 88, 98, 101];

  if ($problemId == 932) {
    if ($issue == 'General Product Questions') {
      $contactReason = 3;
    } else {
      $contactReason = 7;
    }
  } else if (in_array($problemId, $order)) {
    $contactReason = 6;
  } else if (in_array($problemId, $rma)) {
    $contactReason = 8;
  } else {
    $contactReason = 3;
  }

  return $contactReason;
}

function getCurrentTime()
{
  $currtime = time();
  return date("Y-m-d H:i:s", $currtime);
}

function createMouseCaseNotes(
  $issue,
  $deviceSymptoms,
  $deviceConnection,
  $deviceTsSteps,
  $deviceUpdated,
  $deviceOccurrence,
  $fileLocalFname,
  $rmaType,
  $rmaPhone,
  $rmaShippingAddress,
  $rmaBillingAddress,
  $rmaPurchaseDate,
  $rmaPurchasePlace,
  $rmaCountry,
  $rmaZipPostal,
  $rmaStateProvince,
  $rmaCity,
  $rmaStreetAddress,
  $rmaFileLocalFname,
  $issueDescription
) {
  $note = "<b>Please describe your issue:</b> " . $issueDescription . "</br></br>";
  $note .= "<b>Issue Category:</b> " . $issue . "</br>";
  if (($deviceSymptoms != '') && ($deviceSymptoms != '<not set>')) {
    $note .= "<b>Symptoms:</b></br> " . $deviceSymptoms . "</br>";
  }
  if (($deviceConnection != '') && ($deviceConnection != '<not set>')) {
    $note .= "<b>How are you using the device?</b> " . $deviceConnection . "</br>";
  }
  if (($deviceTsSteps != '') && ($deviceTsSteps != '<not set>')) {
    $note .= "<b>What troubleshooting steps did you perform?</b></br> " . $deviceTsSteps . "</br>";
  }
  if (($deviceUpdated != '') && ($deviceUpdated != '<not set>')) {
    $note .= "<b>Did you update the firmware to the latest version?</b> " . $deviceUpdated . "</br>";
  }
  if (($deviceOccurrence != '') && ($deviceOccurrence != '<not set>')) {
    $note .= "<b>Does the issue occur on another PC?</b> " . $deviceOccurrence . "</br>";
  }
  if (!empty($fileLocalFname) && ($fileLocalFname != '<not set>')) {
    $note .= "<b>Photo or video of the issue</b>: See Attached";
  }

  if ($rmaType != '<not set>') {
    $note .= "</br></br><b>Replacement Option:</b> " . $rmaType . "</br>";
    $note .= "<b>Terms & Conditions:</b> Yes</br>";
    $note .= "<b>Phone:</b> " . $rmaPhone . "</br>";
    $note .= "<b>Shipping Address:</b> " . $rmaShippingAddress . "</br>";
    $note .= "<b>Billing Address:</b> " . $rmaBillingAddress . "</br>";
    $note .= "<b>Date of Purchase:</b> " . $rmaPurchaseDate . "</br>";
    $note .= "<b>Place of Purchase:</b> " . $rmaPurchasePlace . "</br>";
    if (!empty($rmaFileLocalFname) && ($rmaFileLocalFname != '<not set>')) {
      $note .= "<b>Proof of Purchase</b>: See Attached";
    }
  }

  if ($rmaCity != '<not set>') {
    $note .= "</br></br><b>Replacement Option:</b> Standard</br>";
    $note .= "<b>Phone:</b> " . $rmaPhone . "</br>";
    $note .= "<b>Street Address:</b> " . $rmaStreetAddress . "</br>";
    $note .= "<b>City:</b> " . $rmaCity . "</br>";
    $note .= "<b>State/Province:</b> " . $rmaStateProvince . "</br>";
    $note .= "<b>Zip/Postal Code:</b> " . $rmaZipPostal . "</br>";
    $note .= "<b>Country:</b> " . $rmaCountry . "</br>";
    $note .= "<b>Date of Purchase:</b> " . $rmaPurchaseDate . "</br>";
    $note .= "<b>Place of Purchase:</b> " . $rmaPurchasePlace . "</br>";
    if (!empty($rmaFileLocalFname) && ($rmaFileLocalFname != '<not set>')) {
      $note .= "<b>Proof of Purchase</b>: See Attached";
    }
  }

  return $note;
}

$result = array();

try {

  $contact = RNCPHP\Contact::fetch($contactId, RNCPHP\RNObject::VALIDATE_KEYS_OFF);

  $incident = new RNCPHP\Incident;
  $incident->PrimaryContact = $contact;
  $incident->Subject = $caseSubject;

  $incident->Threads = new RNCPHP\ThreadArray();

  $serviceProduct = RNCPHP\ServiceProduct::fetch(intval($problemId));
  $incident->Product = $serviceProduct;

  if ($problemId == 1341 && $categoryId != 'NULL') { //Surround Sound Activation
    $serviceCategory = RNCPHP\ServiceCategory::fetch(intval($categoryId));
    $incident->Category = $serviceCategory;
  }

  $contactReason = RNCPHP\CO1\Contact_Reason::fetch(getContactReason(intval($problemId), $issue));
  $incident->CustomFields->CO1->contact_reason = $contactReason;

  if ($orderNumber != 'null') {
    $orderNumber = (strlen($orderNumber) > 20) ? substr($orderNumber, 0, 20) : $orderNumber;
    $incident->CustomFields->CO1->order_number = $orderNumber;
    $incident->CustomFields->c->web_store_order_num = $orderNumber;
  }

  // first idx=0, type=3 for cust entry
  addMessageToIncidentThread($incident, 0, $issue, 3);

  /**
   * Case ICFs
   */
  // serial number, set to uppercase
  if (!empty($serialNumber)) {
    // SysAttrib Length of Field=20
    $serialNumber = strtoupper($serialNumber);
    $serialNumber = (strlen($serialNumber) > 20) ? substr($serialNumber, 0, 20) : $serialNumber;
    $incident->CustomFields->CO1->serial_num = $serialNumber;
  }

  $noteText = sprintf("+ Case Contact ID %d\n", $contact->ID);

  // store order #
  if (!empty($orderNumber)) {
    // ICF Size of Field=20
    $orderNumber = (strlen($orderNumber) > 20) ? substr($orderNumber, 0, 20) : $orderNumber;
    // $incident->CustomFields->c->web_store_order_num = $orderNumber;
  }

  $incident->FileAttachments = new RNCPHP\FileAttachmentIncidentArray(); //is this right?

  // 20201110 robert.surujbhan@oracle.com removed file attachment logic
  // 20201201 robert.surujbhan@oracle.com added file attachment logic for DA-as-Agent flow via Embedded Chat Inlay
  if (!empty($fileLocalFname) && ($fileLocalFname != '<not set>')) {
    // file path in /tmp directory
    $fullFilePath = sprintf("/tmp/%s", $fileLocalFname);

    $file1 = new RNCPHP\FileAttachmentIncident();

    $file1->setFile($fullFilePath);

    $file1->FileName = $fileUserFname;
    $file1->ContentType = $fileContentType;
    $file1->Description = "End-user POP uploaded via ODA";
    $file1->Private = false;

    $incident->FileAttachments[] = $file1;
  }

  if (!empty($rmaFileLocalFname) && ($rmaFileLocalFname != '<not set>')) {
    // file path in /tmp directory
    $fullFilePath = sprintf("/tmp/%s", $rmaFileLocalFname);

    $file2 = new RNCPHP\FileAttachmentIncident();

    $file2->setFile($fullFilePath);

    $file2->FileName = $rmaFileUserFname;
    $file2->ContentType = $rmaFileType;
    $file2->Description = "End-user POP uploaded via ODA";
    $file2->Private = false;

    $incident->FileAttachments[] = $file2;
  }

  /**
   * CO.RMA record logic
   */

  // CO.Products lookup for product SKU
  $product = null;
  $productCode = strtoupper($productNumber);
  if (!empty($productCode)) {
    $product = findProduct($productCode);
  }

  $noteCount = 1;

  // second idx=1, type=1 for private note
  addMessageToIncidentThread($incident, $noteCount++, $noteText, 1);

  if ($rmaNumber != 'null') { //changed
    $rmaText = sprintf("+ RMA Number: %s\n", $rmaNumber);

    addMessageToIncidentThread($incident, $noteCount++, $rmaText, 1);
  }

  if (!empty($chatSessionId)) {
    $chatTranscript = buildChatTranscript($chatSessionId);
    if (!empty($chatTranscript)) {
      $chatTranscript = buildChatTranscript($chatSessionId);
      addMessageToIncidentThread($incident, $noteCount++, $chatTranscript, 5, 2); //html
    }
  }

  $mouseNotes = createMouseCaseNotes(
    $issue,
    $deviceSymptoms,
    $deviceConnection,
    $deviceTsSteps,
    $deviceUpdated,
    $deviceOccurrence,
    $fileLocalFname,
    $rmaType,
    $rmaPhone,
    $rmaShippingAddress,
    $rmaBillingAddress,
    $rmaPurchaseDate,
    $rmaPurchasePlace,
    $rmaCountry,
    $rmaZipPostal,
    $rmaStateProvince,
    $rmaCity,
    $rmaStreetAddress,
    $rmaFileLocalFname,
    $issueDescription
  );
  addMessageToIncidentThread($incident, $noteCount++, $mouseNotes, 3, 2);

  // remove manual queue assignment for the routing rules to take over
  // $incident->Queue = new RNCPHP\NamedIDLabel();
  // $incident->Queue->ID = getQueue(intval($problemId));

  $incident->CustomFields->c->incident_type = new RNCPHP\NamedIDLabel();
  $incident->CustomFields->c->incident_type->id = getIncidentType(intval($problemId));

  $incident->CustomFields->c->incident_source = new RNCPHP\NamedIDLabel();
  $incident->CustomFields->c->incident_source->id = 346;     //Web ODA

  // incident save
  $incident->save();
  // avoid running InProcess state rules again
  // $incident->save(RNCPHP\RNObject::SuppressAll);

  $result = array("status" => "OK", "id" => $incident->ID, "refNo" => $incident->ReferenceNumber);

  // send email receipt via transactional mailing
  $mailingId = RNCPHP\Configuration::fetch("CUSTOM_CFG_RMA_BOT_CPM_MAILING_ID_CUST_RECEIPT")->Value;
  $mailingId = intval($mailingId);
  // check to make sure RMA was created and the mailing ID config is not at a Default value (0 or 1)
  if ($rmaCreated == true && $mailingId > 1) {
    RNCPHP\Mailing::SendMailingToContact($contact, $incident, $mailingId, 0);
  }
} catch (\Exception $e) {
  $mm = new RNCPHP\MailMessage();
  $mm->To->EmailAddresses = array("josh.cabiles.ext@razer.com");
  $mm->Subject = "odamousecasebotprocessor";
  $mm->Body->Text = $e->getMessage();
  $mm->Options->IncludeOECustomHeaders = false;
  $mm->Options->HonorMarketingOptIn = false;
  $mm->send();

  $result = array("status" => "Failed", "exception" => $e->getMessage());
}

respond($result);
