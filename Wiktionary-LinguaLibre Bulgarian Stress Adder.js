// ==UserScript==
// @name     Wiktionary-LinguaLibre Bulgarian Stress Adder
// @version  1
// @grant    GM.xmlHttpRequest
// @author	Kiril Kovachev
// @description Automatically pulls in the stressed form of a Bulgarian lemma on the LinguaLibre record wizard, making it much quicker to know what stress words have.
// @include https://lingualibre.org/wiki/Special:RecordWizard
// ==/UserScript==
const ACUTE = String.fromCodePoint(0x301);
const GRAVE = String.fromCodePoint(0x300);

function documentContainerFromText(text) {
	const container = document.implementation.createHTMLDocument().documentElement;
  container.innerHTML = text;
  return container;
}

// Return stressed of word and record in fetchedAlready
function fetchWord(wordElem, word) {
	 fetchedAlready[word] = word; // Prevent multiple fetches if it takes a while to get the first page load
      GM.xmlHttpRequest({
        method: "GET",
        url: `https://en.wiktionary.org/wiki/${word}`,
        onload: function(response) {
          console.log("Fetched content from Wiktionary");
          const container = documentContainerFromText(response.responseText);
          const firstHeadwordElem = container.querySelector('.headword[lang="bg"]');
          if (firstHeadwordElem) {
            // Cool, use Wiktionary's lemma
            const stressed = firstHeadwordElem.textContent.trim();
            if (stressed && stressed.replace(ACUTE, "") === wordElem.innerText) { // It is possible that the user change to a different word between the time of the fetch and the time of the set; avoid
              wordElem.innerText = stressed;
            }
            fetchedAlready[word] = stressed;
          } else {
           	// Maybe the word doesn't exist, try Chitanka instead
            GM.xmlHttpRequest({
              method: "GET",
              url: `https://rechnik.chitanka.info/w/${word}`,
              onload: function(response) {
                console.log("Fetched content from Chitanka");
                const container = documentContainerFromText(response.responseText);
                const firstHeadwordElem = container.querySelector('#content span');
                if (firstHeadwordElem) {
									const stressed = firstHeadwordElem.textContent.trim();
                  console.log("stressed is " + stressed);
                  if (stressed && stressed.replace(GRAVE, "") === wordElem.innerText) {
                    wordElem.innerText = stressed.replace(GRAVE, ACUTE);
                  }
                  fetchedAlready[word] = stressed.replace(GRAVE, ACUTE);
                } else {
                 	console.log(response.responseText); 
                }
              }
            });
          }
        }
      });
}

const fetchedAlready = {};
setInterval(
  function() {
		const wordElem = document.getElementById("mwe-rws-item");
    if (!wordElem) { return; }
    const word = wordElem.innerText;
    if (word.includes(ACUTE)) { return ; }
    if (word in fetchedAlready) {
      wordElem.innerText = fetchedAlready[word];
      const unfetchedWordList = [...document.getElementsByClassName("mwe-rws-up")].map(wordElem => wordElem.textContent.trim()).filter(word => !(word in fetchedAlready));
      for (const otherWord of unfetchedWordList) {
        	console.log("Trying to fetch " + otherWord + "...");
					fetchWord(wordElem, otherWord); 
      }
    } else {
      fetchWord(wordElem, word);
    }
    // Allow copying the original word if needed (constantly setting its value in the DOM makes it impossible to select)
    wordElem.onClick = function() {
      navigator.clipboard.writeText(wordElem.innerText);
    }
  }, 30
)
