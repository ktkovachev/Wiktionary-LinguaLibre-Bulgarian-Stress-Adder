// ==UserScript==
// @name     Wiktionary-LinguaLibre Bulgarian Stress Adder
// @version  1.2
// @grant    GM.xmlHttpRequest
// @author	Kiril Kovachev
// @description Automatically pulls in the stressed form of a Bulgarian lemma on the LinguaLibre record wizard, making it much quicker to know what stress words have.
// @include https://lingualibre.org/wiki/Special:RecordWizard
// ==/UserScript==
const ACUTE = String.fromCodePoint(0x301);
const GRAVE = String.fromCodePoint(0x300);

function updateCurrentWord(stressed) {
  const wordElem = document.getElementById("mwe-rws-item");
  function updateSafely(newValue) {
    wordObserver.disconnect();
    wordElem.innerText = newValue;
    wordObserver.observe(wordElem, observerConfig);
  }
  if (!wordElem) { return; }
  const word = wordElem.innerText;
  if (word.includes(ACUTE)) { return; }
  if (stressed.replace(ACUTE, "") === word) {
  	updateSafely(stressed);
  }
}

let previousTitle;
function studioObserverCallback(mutationList, observer) {
  for (const mutation of mutationList) {
    const studio = document.getElementById("mwe-rw-studio");
    if (previousTitle !== "Studio") {
      if (studio && studio.firstChild.firstChild.innerText === "Studio") {
        previousTitle = "Studio";
        console.debug("[Studio] Entered studio screen.");
        const wordElem = document.getElementById("mwe-rws-item");
        wordObserver.observe(wordElem, observerConfig);
        fetchWord(wordElem.innerText);
        const unfetchedWordList = [...document.getElementsByClassName("mwe-rws-up")].map(wordElem => wordElem.textContent.trim()).filter(word => !(word in fetchedAlready));
        for (const otherWord of unfetchedWordList) {
          console.debug(`Pre-fetching ${otherWord}`);
          fetchWord(otherWord); 
        }
      } else {
        previousTitle = undefined; 
      }
    } else if (!studio) {
      previousTitle = undefined;
      wordObserver.disconnect();  // Don't observe when the studio view is gone. May be redundant as the observer becomes invalid at such a point regardless.
    }
  }
}

function wordObserverCallback(mutationList, observer) {
  const wordElem = document.getElementById("mwe-rws-item");
	for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      console.debug(`[Word] New word is: ${wordElem.innerText}`);
      fetchWord(wordElem.innerText);
			break;
    }
  }
}

const observerConfig = {childList: true, };
const contentWrapperElement = document.getElementById("mwe-rw-content");
const studioObserver = new MutationObserver(studioObserverCallback);  // Observes when the Studio view is entered, which is useful to (re-)register the wordObserver, because it gets invalidated whenever the view changes.
const wordObserver = new MutationObserver(wordObserverCallback);  // Observes when a word changes in the Studio view, which results in the word being updated.
studioObserver.observe(contentWrapperElement, observerConfig);

function documentContainerFromText(text) {
	const container = document.implementation.createHTMLDocument().documentElement;
  container.innerHTML = text;
  return container;
}

const fetchedAlready = {};
// Update current word and record stress in fetchedAlready
function fetchWord(word) {
  if (word in fetchedAlready) {
     updateCurrentWord(fetchedAlready[word]); 
  } else {
    GM.xmlHttpRequest({
      method: "GET",
      url: `https://en.wiktionary.org/wiki/${word}`,
      onload: function(wiktResponse) {
        const container = documentContainerFromText(wiktResponse.responseText);
        const firstHeadwordElem = container.querySelector('.headword[lang="bg"]');
        if (firstHeadwordElem && firstHeadwordElem.textContent.includes(ACUTE)) {
          // Cool, use Wiktionary's lemma
          const stressed = firstHeadwordElem.textContent.trim();
          fetchedAlready[word] = stressed;
          updateCurrentWord(fetchedAlready[word]);
        } else {
          // Maybe the word doesn't exist, try Chitanka instead
          GM.xmlHttpRequest({
            method: "GET",
            url: `https://rechnik.chitanka.info/w/${word}`,
            onload: function(chitankaResponse) {
              const container = documentContainerFromText(chitankaResponse.responseText);
              const firstHeadwordElem = container.querySelector('#content span');
              if (firstHeadwordElem && firstHeadwordElem.textContent.includes(GRAVE)) {
                const stressed = firstHeadwordElem.textContent.trim().replace(GRAVE, ACUTE);
                fetchedAlready[word] = stressed;
                updateCurrentWord(fetchedAlready[word]);
              } else {
                console.error(`Failed to get both Wiktionary and Chitanka data for ${word}. See below dropdowns for their responses:`);
                console.groupCollapsed("Wiktionary response");
                console.debug(wiktResponse.responseText);
                console.groupEnd();
                console.groupCollapsed("Chitanka response");
                console.debug(chitankaResponse.responseText);
                console.debug(firstHeadwordElem.textContent);
                console.groupEnd();
              }
            }
          });
        }
      }
    });
  }
}
