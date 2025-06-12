async function injectAdSense() {
  return new Promise((resolve, reject) => {
      console.log("injectAdSense");

      if (!document.querySelector('script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {

        const adScript = document.createElement('script');
        adScript.async = true;
        adScript.setAttribute('data-ad-client', 'ca-pub-3479929222894971');

        adScript.setAttribute('data-ad-slot', '5291907390');
        adScript.setAttribute('data-ad-frequency-hint', '30s');
        adScript.setAttribute('data-ad-format', 'auto');
        adScript.setAttribute('data-full-width-responsive', 'true');
    
        adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

        adScript.onload = () => {
          console.log("AdSense script loaded");
          loadAd();
          resolve();
        };
    
        document.body.appendChild(adScript);
      } else {
        console.log("AdSense script already loaded");
        loadAd();  
        resolve();
      }
    });
  }
  
  function loadAd() {
    return new Promise((resolve, reject) => {

        const adContainer = document.createElement('ins');
        adContainer.className = "adsbygoogle";

        document.body.appendChild(adContainer);
      

        (adsbygoogle = window.adsbygoogle || []).push({});

        adBreak = adConfig = function (o) {
          adsbygoogle.push(o);
        };
        adConfig({
          sound: 'on',
          preloadAdBreaks: 'on',
          onReady: showAd,
        });
    });
  }
  
  function gShowAd({ onAdClosed = () => {}, onAdFailedToLoad = () => {}, onAdRewarded = () => {} } = {}) {
    console.log("show Ad");

    adBreak({
        type: 'next',
        name: 'continue_game',
        beforeAd: () => {
            console.log("showAd : beforeAd : onAdRenderer");
        },
        afterAd: () => {
            console.log("showAd : afterAd : onAdMediaEnd");
        },
        adBreakDone: (info) => {
          console.log(`showAd result: ${info.breakStatus}`); 
          console.log("showAd : adBreakDone : onAdClosed");

          if(info.breakStatus == 'viewed'){
            onAdClosed();
          }else{
            onAdFailedToLoad(info.breakStatus);
          }
        },
    });
  }

  function gPrerollAd(){
    adBreak({
        type: 'preroll',
        name: 'preroll',
        adBreakDone: (info) => {
          console.log(`Preroll result: ${info.breakStatus}`);
          console.log("prerollAd : adBreakDone");
        }
      });
  }

  function gRewardedAd({ onAdClosed = () => {}, onAdFailedToLoad = () => {}, onAdRewarded = () => {} } = {}){
    adBreak({
        type: 'reward',
        name: 'one_more_chance',
        beforeAd: () => {
            console.log("rewardedAd : adBreakDone");
        },
        afterAd: () => {
          console.log("rewardedAd : afterAd : onAdClosed");
          onAdClosed();
        },
        beforeReward: (showAdFn) => {
          showAdFn();

        },
        adDismissed: () => {
            console.log("rewardedAd : adDismissed");

        },
        adViewed: () => {
            console.log("rewardedAd : adViewed");
            onAdRewarded();
        }
      });
  }

  function showAd(){
    console.log("gOnAdReady");
    gPrerollAd();
  }
  function time(call){
    call();
  }

  injectAdSense();

window.injectAdSense = injectAdSense;
window.gShowAd = gShowAd;
window.gPrerollAd = gPrerollAd;
window.gRewardedAd = gRewardedAd;
