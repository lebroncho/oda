<?php
/**
 * Oracle Service Cloud Connect Knowledge Foundation API/JSON Controller
 * File:        odakfanswers.php
 * @author      Robert Surujbhan <robert.surujbhan@oracle.com>
 * @copyright   2023 Oracle Corporation. All rights reserved.
 */
 /* * *******************************************************************************************
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ****************************************************************************************** */

/**
 * exit with 403-Forbidden if request is not from ODA
 */
$isFromODA = strpos(strtolower($_SERVER['HTTP_USER_AGENT']), 'oracledigitalassistant/') === false ? false : true;
if ($isFromODA !== true) httpCodeResponse(403);

require_once(get_cfg_var('doc_root').'/include/ConnectPHP/Connect_kf_init.phph');
require_once(get_cfg_var('doc_root').'/include/ConnectPHP/Connect_init.phph');

// globals
$kfAppIdentifier = "KFAnswers ODA Proxy";
$kfApiVersion = 1;
$RNCPHPKF = "RightNow\\Connect\\Knowledge\\v".$kfApiVersion;
$RNCPHPKF_AnswerContent = $RNCPHPKF."\\AnswerContent";

initConnectAPI("api_integration","H@%ttd9945HQ");
$siteDomain = "mysupport.razer.com";

use RightNow\Connect\Knowledge\v1 as RNCPHPKF;

use RightNow\Connect\v1_4 as RNCPHP;
$context = RNCPHP\ConnectAPI::getCurrentContext();
$context->ApplicationContext = "ODA-kfanswers";

_debug();

/**
 * request handler using "type" query parameter
 */
$request = strtolower($_GET["type"]);
if ($request === "searchcontent") {
    SearchContent();
}
elseif ($request === "ratecontent") {
    // calls Content::RateContent using NamedIDs
    try {
        $a_id = $_GET["a_id"];
        if ($a_id > 0) {
            $sessionToken = CreateInteractionId();
            $cs = $RNCPHPKF_AnswerContent::fetch($a_id, RNCPHP\RNObject::VALIDATE_KEYS_OFF);
            $rate = new RNCPHPKF\ContentRate();
            $rate->ID = 5;
            $scale = new RNCPHPKF\ContentRate();
            $scale->ID = 5;
            $contentRequestStatus = $cs->RateContent($sessionToken, $rate, $scale);
            httpCodeResponse(201, sprintf("Content Rated on Answer %d %s @ %d ms", $a_id, $contentRequestStatus->Status->LookupName, $contentRequestStatus->ElapsedTimeInMilliSeconds));
        }
        else {
            httpCodeResponse(400, "Invalid or missing Answer ID for RateContent");
        }
    }
    catch (\Exception $e) {
        httpCodeResponse(500, sprintf("RateContent Exception: %s", $e->getMessage()));
    }
}
else {
    // no other methods allowed
    httpCodeResponse(400, "No action requested");
}


/**
 * main functions
 */
function SearchContent() {
    GetAnswers("search");
}

function GetAnswers($type = "popular") {
    
    global $siteDomain;

    if(enableKfApi() === true) {

        try {
            $sessionToken = CreateInteractionId();
            $thisInteractionId = $sessionToken;
            
            $limit = $_GET["limit"];
            if (empty($limit) || $limit == 0) {
                httpCodeResponse(400, "No limit set");
            }

            if ($type === "search") {

                $searchTerms = $_GET["q"];
                if (empty($searchTerms)) {
                    httpCodeResponse(400, "No search terms");
                }

                $regularSearch = new RNCPHPKF\ContentSearch();

                $searchOrigin = null;
                $sortOptions = null;
                $offset = 0;
                $includeRelatedSearches = false;
                $includeSpellingSuggestions = false;
                $useSpecialResponse = true; // Excerpt

                // Operation Signature: SearchResponse SearchContent ( String $knowledgeInteractionId, String $searchTermss, ContentSearchOrigin $searchOrigin, ContentSortOptions $sortOptions, int $limit, int $start, bool $incRelSearches, bool $incSpellChecks )

                $searchResponse = $regularSearch->SearchContent($sessionToken, $searchTerms, $searchOrigin, $sortOptions, intval($limit), intval($offset), $includeRelatedSearches, $includeSpellingSuggestions, $useSpecialResponse);

                $contentStatus = $searchResponse->Status;

                $total_results = $searchResponse->TotalResults;
                $num_results = count($searchResponse->SummaryContents);
                $spelling_suggestions = $searchResponse->SpellingSuggestions;
                $similar_searches = $searchResponse->SimilarSearches;
                $summaryContents = $searchResponse->SummaryContents;

                $detail = $contentStatus->Status->ID . "|" . $contentStatus->Status->LookupName . "|" . $contentStatus->ElapsedTimeInMilliSeconds . "|" . $contentStatus->Description . "|" . $total_results;
            }

            $answerResults = array();

            if ($num_results > 0) {
                foreach ($summaryContents as $sc) {

                    if ($sc instanceof RNCPHPKF\AnswerSummaryContent) {

                        $content_ret = $sc->GetContent($sessionToken);

                        $ansTitle = $sc->Title;                 //Content title
                        $ansExcerpt = $sc->Excerpt;             //Excerpt of document content
                        $ansId = intval($content_ret->Name);    //Reference number of the answer (a string version of the ID)
                        $ansSummary = $content_ret->Summary;    //Title or short summary
                        $ansQuestion = $content_ret->Question;  //Description or question portion of the answer
                        $ansSolution = $content_ret->Solution;  //Solution or answer portion of the answer
                        $ansCreated = date("Y-m-d H:i:s", $content_ret->CreatedTime);  //Created date and time
                        $ansUpdated = date("Y-m-d H:i:s", $content_ret->UpdatedTime);  //Last updated date and time
                        $ansType = $content_ret->AnswerType->LookupName;    //Type of storage for answer information (HTML, URL, File Attachment)
                        //$ansLink = RNURL::getShortEufBaseUrl(true) . RNURL::defaultAnswerUrl($sc->ID); //CP Url for specified answer
                        $ansLink = sprintf("https://%s/app/answers/detail/a_id/%d", $siteDomain, $sc->ID);
                        $ansUrl = $content_ret->URL;    //URL which will return the answer, if type is URL (file name if type is File Attachment)

                        $ansSpecialResponse = $content_ret->SpecialResponse;

                        $answer = array("ID" => $ansId,
                                        "Type" => $ansType,
                                        "Title" => $ansTitle,
                                        "Summary" => $ansSummary,
                                        "Question" => $ansQuestion,
                                        "Excerpt" => $ansExcerpt,
                                        //"Solution => $ansSolution,
                                        "Link" => $ansLink,
                                        "URL" => $ansUrl,
                                        "SpecialResponse" => $ansSpecialResponse,
                                        "Created" => $ansCreated,
                                        "LastUpdated" => $ansUpdated
                                        );

                        if (!empty($ansSpecialResponse)) {
                            array_push($answerResults, $answer);
                        }
                    }
                }
            }

            // reset and override numResults due to special response validation
            $numResults = count($answerResults);

            respond("OK", $detail, $numResults, $thisInteractionId, $answerResults);
        }
        catch (\Exception $e) {
            httpCodeResponse(500, sprintf("SearchContent Exception: %s", $e->getMessage()));
        }
    }
    else {
        httpCodeResponse(500, "KF API Not Enabled");
    }
}

function CreateInteractionId() {
    global $kfAppIdentifier;
    //StartInteraction ( String $appIdentifier, String $userIPAddress, String $userAgent, String $referrerURL, String $cpSessionId)
    $cpSessionId = strlen($_GET["session"]) === 8 ? $_GET["session"] : null;
    return RNCPHPKF\Knowledge::StartInteraction($kfAppIdentifier, $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_USER_AGENT'], null, $cpSessionId);
}

function enableKfApi() {
    return RNCPHPKF\Knowledge::Enabled();
}

function httpCodeResponse($code, $textMessage = null) {
    $type = null;
    switch($code) {
        case 200:
            $type = "OK";
            break;
        case 201:
            $type = "Created";
            break;
        case 400:
            $type = "Bad Request";
            break;
        case 401:
            $type = "Unauthorized";
            break;
        case 403:
            $type = "Forbidden";
            break;
        case 500:
            $type = "Internal Server Error";
            break;
        default:
            $type = "Error";
    }
    header(sprintf("HTTP/1.1 %d %s", $code, $type));
    if (!empty($textMessage)) {
        header("Content-Type: text/plain");
        echo $textMessage;
    }
    // exit program normally
    exit(0);
}

function respond($p_status, $p_detail, $p_num_results, $kf_interaction_id, $p_data) {
    header("Content-Type: application/json");
    $response = array(
        "status" => $p_status, 
        "detail" => $p_detail, 
        "results" => intval($p_num_results), 
        "interactionId" => $kf_interaction_id, 
        "data" => $p_data
    );
    echo json_encode($response);
}

function _debug() {
    $method = $_SERVER['REQUEST_METHOD'];
    $pdata = null;
    if ($_SERVER['REQUEST_METHOD'] === "POST") {
        $input = file_get_contents('php://input');
        $pdata = json_decode($input);
    }
    $headersAll = getallheaders();
    $userIp = $_SERVER['REMOTE_ADDR'];
    $params = array("none");
    if ($_SERVER['argc'] > 0) {
        $params = $_SERVER['argv'];
    }
    $contentList = "REQUEST_METHOD, REMOTE_ADDR, argc-params, SERVER, headersAll, POSTdata";
    $m = $contentList . "\n\n" . $method . "\n\n" . $userIp . "\n\n" . var_export($params,1) . "\n\n" . var_export($_SERVER,1) . "\n\n" . var_export($headersAll,1) . "\n\n" . var_export($pdata,1);
    _sendDebugMessage("Razer-oda-kfanswers", $m);
}

function _sendDebugMessage($p_subject, $p_text) {
    try {
        $mm = new RNCPHP\MailMessage();
        $mm->To->EmailAddresses = array("robert.surujbhan@oracle.com");
        $mm->Subject = $p_subject . " @ " . date("Y-m-d H:i:s", time());
        $mm->Body->Text = $p_text;
        $mm->Options->IncludeOECustomHeaders = false;
        $mm->Options->HonorMarketingOptIn = false;
        $mm->send(); 
    } catch (\Exception $e) {
        echo sprintf("Exception _sendDebugMessage: %s", $e->getMessage());
    }
}
?>