# Structured extraction from images and documents

A vision or language model reads an image (a receipt, a card, an ID, a form, a screenshot) and returns fields. Asking for a typed shape (a JSON schema, structured output, tool parameters) makes integration easy. It does not make the values true: a model will return a well-formed, plausible number it never saw.

Asked plainly ("what's in this image?"), a model describes the image in vague prose. Asked for JSON in the message text, it often wraps the JSON in a sentence ("Here is the receipt in JSON format:") and gets some numbers slightly wrong. Ask through the API's structured output instead, and put rules for reading the document in the system prompt. The rules are where accuracy comes from.

## The request

```ts
import { generateText, Output } from "ai";
import { z } from "zod";

const ReceiptSchema = z.object({
  merchant: z.string().nullable(),
  date: z.string().nullable(),                 // ISO 8601, null if not printed
  currency: z.string().nullable(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
  })),
  total: z.number().nullable(),
});

const { output } = await generateText({
  model,                                        // pinned model id, recorded with the result
  temperature: 0,
  system: RECEIPT_RULES,                        // versioned, see below
  output: Output.object({ schema: ReceiptSchema }),
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Extract this receipt." },
      { type: "file", mediaType: "image/jpeg", data: imageBytes },
    ],
  }],
});
```

The schema is turned into the model's output format and the reply is checked against it. A local model (for example through Ollama) works the same way and keeps sensitive images on the machine; measure its accuracy separately, it is usually lower.

## Rules that belong in the prompt

These come from real failures:

- **Copy digits exactly as printed.** No rounding: a model reported a printed `1.105` as `1.1` until told not to. Say that quantities can be decimals (a weight like `0.550` kg).
- **Never invent.** Only items that are printed; a missing field is `null`, not a guess. (Without this rule a model added a line item that wasn't on the receipt.)
- **Check the arithmetic:** each line's quantity times unit price equals its total. Ask the model to re-read the line when it doesn't.
- **Detect the number format before reading.** Some documents write `7,499.00`, others `7.499,00`; models confuse the thousands separator with the decimal point. Tell the model to decide the format from the numbers on the document first, then output plain numbers with a period (`7499.00`).
- Say which printed amount is the total ("the final total shown on the receipt"), so it doesn't pick a subtotal or the amount paid.
- Say what to do with unreadable text (use `null`), and how to write dates (ISO 8601).

Each rule exists because of a failure seen in testing. Treat the prompt like code: keep it in version control, add a rule only for an observed failure, and re-run the test set after every change, since a new rule can break a case that used to pass.

## Validation after parsing

The schema check is the first layer. Then the domain:

- recompute every line (`quantity * unitPrice`) and the sum of lines against `total`, with a small tolerance for rounding;
- formats and ranges: a date that exists and isn't in the future, a currency code from a known list, check digits on IDs, an expiry after the issue date;
- flag, don't fix: a failed check marks the record for review instead of silently correcting it.

Decide what happens on failure: ask the person to confirm or correct, retry with a better image, or route to manual review. Never silently store a value that failed validation. Keep the original image linked to the extracted record for audit; pre-process (rotate, crop) only if it measurably helps. Image size is a cost lever: on a model with a high-resolution image tier, a 2000×1500 image can cost about 2.5 times the tokens it did on older models. If you don't need the detail, downscale before you send.

## Testing it

Collect real samples with known correct values, including the hard ones:
- glare, blur, low light, partial crop, rotation;
- missing fields (no date printed);
- comma-decimal and period-decimal documents;
- look-alike characters (0 and O, 1 and l, 5 and S);
- the wrong kind of document entirely.

Measure per field: correct, wrong, and correctly marked unknown. The number that matters most is **wrong-but-confident**: a value returned as known that is false.

**Run each sample several times** (five is a reasonable start) and compare every run with the known values; when you don't have known values yet, compare every run with the first one, field by field (item count, each name, quantity, unit price, line total, and the total), and report which runs differ. Even at temperature 0, runs differ in small ways: a digit, a slightly different item name. A field that changes between runs is not dependable, which is why the validation layer exists. Re-run the set when the model, prompt or pre-processing changes, and record the versions with the results.

## After extraction works

Once the values are trustworthy, everything after is ordinary application code on validated records: categorizing purchases (a second model call over the stored items), weekly and monthly spending summaries, an expense report from a stack of receipts, price tracking over time, and semantic search across past receipts ([VECTOR-SEARCH.md](VECTOR-SEARCH.md)). Build those on validated data only.
