# Wiktionary-LinguaLibre Bulgarian Stress Adder
This is a Greasemonkey user script for use on the [LinguaLibre](https://lingualibre.org) recording wizard, which automatically fetches the accented headword from [Wiktionary](https://en.wiktionary.org) or [Chitanka](https://rechnik.chitanka.info).

## About
Using LinguaLibre, you can record massive amounts of audio in one session (hundreds per hour), which I use to record Bulgarian words for Wiktionary. This is a very efficient process,
but it is hampered by the fact that you very often don't know the stress of every word in the dictionary; this makes it necessary to look up the word in question on Wiktionary or Chitanka
in order to figure out the correct stress.
To solve this problem a bit faster, I developed this script, which does the lookup stage automatically, grafting the found stressed headword from Wiktionary (or Chitanka as a backup)
onto the interface of the record-wizard. Thus, when you select a word, if it finds a stressed Bulgarian headword-line for that word, it will replace the unaccented word with the accented word.
This means you only need to use the wizard itself, and do not need to change to other tabs to find out the information.

## Running
The script must be used with [Greasemonkey](https://www.greasespot.net/), as it relies on the Greasemonkey request API that lets you bypass CORS.

To use it, copy the contents of the script in this repository to a new script (to create a new script, click on the extension icon, and an option should appear).
When you go onto LinguaLibre and enter the record-wizard, the script will take effect. If you, e.g., import a wordlist via a Wikimedia category ("Category:Bulgarian lemmas" is a good shout),
the list should hopefully begin to be updated with stressed lemmas. Note that only the currently-selected word will have its stress shown, but all words will have their stress fetched in advance,
so long as one is available on Wiktionary/Chitanka. Otherwise, no stress is added, and the experience falls back to its usual form.

## Features
- Automatically fetches stressed headwords for Bulgarian words
- Memoizes results so as to not wastefully re-fetch content
- Automatically pre-fetches the entire wordlist so that you don't encounter any delays while recording

## To-do
- Use a MutationObserver in order to not run the function on an interval
- Allows you to copy the being-recorded word by clicking on it (meant to be a feature, but broken)

## History
As a further improvement, I made the script memoize its results, meaning that when an entry is fetched, it will be associated with the word for the duration of the session, and
instead of fetching the content and waiting for it again (if returning to re-record the same word later on), it can be immediately fetched from the local memo.
A natural extension of this idea is pre-fetching the entire list of words, which is done to make even the half-second delay between selecting a new word and seeing its stressed result
closer to instantaneous.

# License
I hope for other Bulgarian editors on Wiktionary to be able to use this to help them too, so I want to put no restrictions at all on this script — on the contrary, if there were a license to "give"
rights or incentivize use I would prefer that! There being no such thing, this project uses the [Unlicense](https://unlicense.org/).
