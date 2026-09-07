# Text Animations

Animations that modify text content character-by-character, word-by-word, or line-by-line. Works on `text` elements and shapes with `containerText`.

## typewriter

Classic character-by-character text reveal.

```javascript
Yappy.typewriter(id);
Yappy.typewriter(id, 2000);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear`
- **Behavior**: Reveals one character at a time from start to end. Optimizes updates — only calls `updateElement` when character count actually changes.

## typewriterCursor

Typewriter effect with a blinking `|` cursor.

```javascript
Yappy.typewriterCursor(id);
Yappy.typewriterCursor(id, 2000);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear`
- **Cursor**: `|` character appended, blinks every 530ms independently of typing speed
- **Behavior**: Cursor removed on completion

## wordByWord

Reveals text one word at a time.

```javascript
Yappy.wordByWord(id);
Yappy.wordByWord(id, 2000);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear`
- **Behavior**: Splits on `\s+`, reveals complete words with original whitespace preserved

## textScramble

Hacker/decode effect — random characters gradually resolve to real text.

```javascript
Yappy.textScramble(id);
Yappy.textScramble(id, 2000, { params: { charset: 'ABCDEF0123456789' } });
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |
| `params.charset` | alphanumerics + symbols | Custom character set for scramble |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear`
- **Behavior**: Whitespace is always preserved. Characters gradually lock from left to right while unresolved positions show random characters from the charset.

## textDelete

Erases text character-by-character from end to start.

```javascript
Yappy.textDelete(id);
Yappy.textDelete(id, 1000);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear`
- **Behavior**: Reverse typewriter — useful for exit animations or text transitions

## textReplace

Delete old text then type new text (3-phase transition).

```javascript
Yappy.textReplace(id, 'New Text Here', 1500);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `newText` | (required) | The replacement text |
| `duration` | 1500 | Duration in ms |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear`
- **Phases**:
  - 0–40%: Delete old text (character by character)
  - 40–50%: Pause (empty)
  - 50–100%: Type new text (character by character)

## textCountUp

Animated number counter with formatting options.

```javascript
Yappy.textCountUp(id, 0, 1000);
Yappy.textCountUp(id, 0, 99.9, 2000, {
    params: { prefix: '$', suffix: 'M', decimals: 1, useCommas: true }
});
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `startValue` | (required) | Starting number |
| `endValue` | (required) | Ending number |
| `duration` | 1000 | Duration in ms |
| `params.prefix` | `''` | Text before number (e.g. `'$'`) |
| `params.suffix` | `''` | Text after number (e.g. `'%'`) |
| `params.decimals` | 0 | Decimal places |
| `params.useCommas` | true | Thousand separators |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `easeOutQuad` (default, overridable)
- **Output example**: `$1,234.5M`

## lineByLine

Reveals multi-line text one line at a time.

```javascript
Yappy.lineByLine(id);
Yappy.lineByLine(id, 3000);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear`
- **Behavior**: Splits on `\n`, reveals complete lines progressively

## charByChar

Advanced per-character reveal with GSAP-style stagger control.

```javascript
Yappy.charByChar(id);
Yappy.charByChar(id, 1500, { each: 30, from: 'center' });
Yappy.charByChar(id, 2000, { each: 50, from: 'random' });
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |
| `stagger.each` | 50 | Delay per character (ms) |
| `stagger.from` | `'start'` | Distribution: `'start'`, `'end'`, `'center'`, `'edges'`, `'random'` |

- **Animated Properties**: `text` or `containerText`
- **Easing**: `linear` (for reveal timing)
- **Behavior**: Non-space characters get individual stagger delays; spaces inherit the previous character's delay. Supports full `StaggerConfig`.

## Compatibility Notes

- All text animations work on both standalone `text` elements and shapes with `containerText`
- Text animations modify the text property directly — they conflict with each other
- The original text is restored when animation completes (via `onComplete` snap)
- Combine with position/opacity animations freely (no property conflicts)
