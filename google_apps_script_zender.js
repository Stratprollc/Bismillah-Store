/**
 * Shop Master POS - Official & Stabilized QR Fetcher
 * Designed to completely bypass Hostinger Firewall & Google Dropouts
 */
function linkWhatsAppDevice() {
  // আপনার অফিশিয়াল জেন্ডার টোকেন এবং এপিআই এন্ডপয়েন্ট (ডকুমেন্টেশন অনুযায়ী)
  var url = "https://app.sellerscampus.com/api/get/wa.qr?token=4fe17fcfe73d5035f55b9144fa10e07443659005";
  
  var options = {
    "method": "get",
    "muteHttpExceptions": true, // হোস্টিনগারের যেকোনো সিকিউরিটি ডিলে বা এরর কোডকে গুগলে ক্র্যাশ করা থেকে আটকাবে
    "followRedirects": true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/plain, application/json"
    }
  };
  
  var maxRetries = 4;        // ৪ বার অটো-রিট্রাই করবে
  var delayMiliseconds = 3000; // প্রতি রিট্রাইয়ের মাঝে ৩ সেকেন্ড গ্যাপ
  
  for (var attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      Logger.log("ShopMaster Official Handshake Attempt " + attempt);
      var response = UrlFetchApp.fetch(url, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText().trim();
      
      Logger.log("HTTP Status: " + responseCode);
      
      // যদি কানেকশন সাকসেস না হয় অথবা জেন্ডার থেকে কোনো ফলস/ডেমো ডেটা আসে
      if (responseCode !== 200 || !responseText || responseText.includes('"data":false') || responseText.length < 100) {
        Logger.log("Invalid or Demo payload detected on attempt " + attempt + ". Re-fetching in 3s...");
        Utilities.sleep(delayMiliseconds);
        continue;
      }
      
      // যখন জেন্ডার নোড ইঞ্জিন থেকে আসল ক্রিপ্টোগ্রাফিক কিউআর স্ট্রিংটি চলে আসবে
      Logger.log("Real WhatsApp QR Secured on attempt " + attempt);
      
      return JSON.stringify({
        status: "success",
        qr: responseText // আসল লাইভ কিউআর ডাটা
      });
      
    } catch (e) {
      Logger.log("Catch Error on attempt " + attempt + ": " + e.toString());
      if (attempt === maxRetries) {
        return JSON.stringify({
          status: "error",
          message: "Handshake Failed after 4 attempts. Technical Details: " + e.toString()
        });
      }
      Utilities.sleep(delayMiliseconds);
    }
  }
}

/**
 * Shop Master POS - WhatsApp Phone Number Linking (OTP Method)
 * Completely bypasses QR Code scanning for Merchants
 */
function generateWALinkingCode(merchantPhone) {
  // জেন্ডার অফিসিয়াল ওটিপি লিঙ্ক এন্ডপয়েন্ট (আপনার একটিভ সিক্রেট টোকেন সহ)
  // এখানে merchantPhone মার্চেন্টের ইনপুট দেওয়া মোবাইল নম্বর
  var url = "https://app.sellerscampus.com/api/create/wa.link?secret=4fe17fcfe73d5035f55b9144fa10e07443659005&phone=" + encodeURIComponent(merchantPhone);
  
  var options = {
    "method": "get",
    "muteHttpExceptions": true,
    "headers": {
      "Accept": "application/json"
    }
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText().trim();
    var json = JSON.parse(responseText);
    
    // জেন্ডার এপিআই সফলভাবে ৮ ডিজিটের কোড রিটার্ন করলে
    let code = json.code || (json.data && json.data.qrstring) || null;
    if (json.status === 200 && code) {
      return JSON.stringify({
        status: "success",
        code: code // এই ৮ ডিজিটের কোডটি ফ্রন্টএ্যান্ডে বড় করে দেখাবেন
      });
    } else {
      return JSON.stringify({
        status: "error",
        message: json.message || "Could not generate code. Make sure number is valid."
      });
    }
  } catch (e) {
    return JSON.stringify({
      status: "error",
      message: "Network Error: " + e.toString()
    });
  }
}

