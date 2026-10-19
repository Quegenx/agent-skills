# Phone numbers

A phone field takes what people type, stores one canonical form and shows a readable one. This file covers the input, E.164 storage, validation with libphonenumber and Israeli numbers as the worked case. Sources: [skills-il, israeli-phone-formatter] (MIT), with every number range checked against Google's libphonenumber metadata (the `phonenumbers` 9.0.41 Python port) and Wikipedia's [Telephone numbers in Israel](https://en.wikipedia.org/wiki/Telephone_numbers_in_Israel), the source's own citation. Where the source and those disagree, the checked form is written and the source's line is named once. The Flutter input mask is in [flutter-ux FORMATTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/FORMATTING.md#phone-numbers); SMS consent is in [marketing/sms-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SKILL.md).

## The field

- `type="tel"` for the phone keypad and `autocomplete="tel"` (1.3.5) ([FORMS.md](FORMS.md#autocomplete-and-input-types)).
- Accept spaces, hyphens, parentheses and a leading `+` as typed, and normalize after; never filter characters while the user types ([FORMS.md](FORMS.md#error-messaging)).

## Store E.164, display with separators

- **One canonical column** in E.164: `+`, country code, national number, no separators. Render separators only for display [skills-il, israeli-phone-formatter].
- **Israel:** drop the leading trunk `0` and prepend `+972`: `052-xxx-xxxx` becomes `+97252xxxxxxx`, never `+9720...` [skills-il, israeli-phone-formatter]; libphonenumber's E.164 output confirms it.
- **The source's reason is wrong.** It says strict parsers such as libphonenumber and the WhatsApp Business API "will reject" `+972-52-123-4567`. libphonenumber parses hyphenated, spaced and parenthesised input (`parse('+972-52-123-4567')` gives national number `521234567`), and Meta says "Plus signs (`+`), hyphens (`-`), parenthesis (`(`,`)`), and spaces are supported in send message requests" ([WhatsApp Cloud API, phone numbers](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers/)). E.164 is still the storage form, for one spelling per number, not because separators are rejected.
- **Keep the `+`.** Meta: "We highly recommend that you include both the plus sign and country calling code", and "If the plus sign is omitted, your business phone number's country calling code is prepended" (same page). A digits-only value loses that signal.
- **Length:** ITU E.164 caps a number at 15 digits. The source's "8-15 digits" minimum appears in none of the sources checked; treat it as unverified.

## Validate with libphonenumber

- Use libphonenumber (`google-libphonenumber` or `libphonenumber-js` in JavaScript, as the source names them) for validity, type and formatting; a regex is a light shape check at most [skills-il, israeli-phone-formatter].
- **The source's regex over-accepts.** `^0(5[012345689])\d{7}$` passes numbers libphonenumber rejects: mobile validity is per sub-range, `5(?:[0-2][02-9]|[36]\d|[49][2-9]|8[3-7])\d{6}` plus sub-ranges of 055. So `0501...`, `0511...`, `0521...`, `0551...`, `0581...` and `0591...` samples fail; the source's own `0521234567` example, documented as valid, returns `False`. Take test numbers from libphonenumber's example numbers, not from the source.
- **Display formats** libphonenumber produces for Israel: national `050-234-5678` (3-3-4, its example mobile number), landline `02-625-1111`, international `+972 50-234-5678`, toll-free `1-800-123-456`. The source writes `052-1234567` and `+972-52-123-4567`.

## Israeli number ranges

| Kind | Range | Checked against |
| --- | --- | --- |
| Trunk prefix | `0` | libphonenumber national prefix |
| Mobile | `05X` plus 7 digits (10 with the `0`) | libphonenumber: national length 9 |
| Landline | `0X` plus 7 digits (9 with the `0`), areas `02`, `03`, `04`, `08`, `09` | libphonenumber fixed line `(?:2[0-8]\|[3489]\d)\d{6}` |
| VoIP / non-geographic | 718, 722-723, 732-733, 737, 747, 762, 765, 768, 77X, 782, 792-799, plus sub-ranges of 728, 738, 783, 785, 787 and 788 | libphonenumber VoIP pattern. Nothing at 075; Wikipedia lists neither 075 nor 078, and marks 071 8XX "inoperative". The source's `07[1-9]` over-accepts |
| Toll-free | `180[019]XXXXXX` and `1255XXX` | libphonenumber; the source lists only 1-800 |
| Shared cost | `1700XXXXXX`, and `1599` (UAN), both "Business toll" on Wikipedia | libphonenumber files 1700 as SHARED_COST; Wikipedia. The source calls 1-700 premium |
| Premium rate | `19XX` (`1(?:200\|9(?:0[0-2]\|19\|9\d))\d{6}`) and `1212` | libphonenumber |
| Emergency | `100` police, `101` MDA, `102` fire | libphonenumber `is_emergency_number`; never format these with `+972` [skills-il, israeli-phone-formatter] |

- **Abroad:** libphonenumber's `no_international_dialling` lists only `1700`, which Wikipedia calls "Not available from most countries outside Israel"; Wikipedia says 19XX premium numbers and the 10X, 11X and 12XX short codes can't be reached from abroad. The source's blanket "1-800 ... cannot be dialed internationally" has no support in either.
- **056 and 059** are Palestinian carriers (Ooredoo Palestine and Jawwal, per Wikipedia). libphonenumber treats them as valid mobile numbers for region IL, so it won't flag them; treat allocation as a numbering-policy input only. The source and old line used it to establish an Israeli SIM requirement; a prefix does not prove the current SIM provider, assignment, reachability, residency or citizenship. [libphonenumber FAQ](https://github.com/google/libphonenumber/blob/master/FAQ.md), [falsehoods](https://github.com/google/libphonenumber/blob/master/FALSEHOODS.md).
- **057** is unallocated; Wikipedia gives it as Hot Mobile's former prefix until November 2014. **055** is split across many MVNOs (Wikipedia).
- **Star services** (`*XXXX`): the source lists them, but libphonenumber's short-number metadata does not (`*2421` is invalid there). Left out.

## The prefix is not the carrier

"The prefix in a mobile number reflects the **issuing** carrier, not the active SIM provider. Do not bill, route SMS, or gate features on prefix-derived carrier inference." For the live carrier, use an HLR or portability lookup [skills-il, israeli-phone-formatter]. The State Comptroller confirms that the portability program began on 1 December 2007; the old line left the source's 2007 date unverified. [State Comptroller report](https://library.mevaker.gov.il/sites/DigitalLibrary/Pages/Reports/1746-44.aspx).

## Prove it

Typing `050 234 5678`, `050-234-5678` and `+972 50 234 5678` into the field stores the same E.164 value with its `+`; the display shows libphonenumber's format, not a hand-written mask; the phone keypad opens and autofill offers the saved number; test fixtures pass `isValidNumber` in libphonenumber (no `0521234567`-style samples); `100`, `101` and `102` are never rewritten to `+972`; and nothing routes SMS or picks a carrier from the prefix.
