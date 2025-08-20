# Wissenslandkarte Engineering

Eine interaktive Visualisierung von Engineering-Kompetenzen als hexagonale Landkarte zum Erkunden, Pannen und Zoomen.

## Was ist das?

Die Wissenslandkarte ist eine webbasierte Anwendung, die Engineering-Skills in verschiedenen Themenbereichen (wie Daten & Storage, OS & Network, etc.) als interaktive, hexagonale Kacheln darstellt. Jede Kachel repräsentiert eine spezifische Kompetenz und öffnet bei Klick ein Modal mit detaillierten Informationen zu "Was ist das?" und "Warum ist das wichtig?".

## Bedienung

- **Ziehen**: Karte verschieben
- **Mausrad**: Zoomen
- **+/-**: Ein-/Auszoomen
- **Tab**: Zwischen Kacheln navigieren
- **Enter/Leertaste**: Modal öffnen/schließen
- **ESC**: Modal schließen

## Inseln und Kacheln anordnen

Die Anwendung besteht aus **Inseln** (Kategorien), die jeweils **hexagonale Kacheln** (Skills) enthalten. Die Inseln sind automatisch in einem **3-spaltigen Grid** angeordnet.

### Insel-Layout

Die Inseln werden automatisch in einem 3×3 Grid platziert:

```
[Daten & Storage]     [OS & Network]         [Delivery & Platform]
[Zusammenarbeit]      [Programmierung]       [Qualität & Testing]  
[AI]                  [Architektur]          [Security]
```

### Kategorie-Struktur

```json
{
  "Kategoriename": {
    "color": "text-purple-300",      // Tailwind-Farbklasse für Text
    "background": "bg-purple-300",   // Tailwind-Farbklasse für Hintergrund  
    "width": 4,                      // Anzahl Spalten im hexagonalen Grid der Kacheln
    "skills": { ... }                // Skills-Objekt mit den Kacheln
  }
}
```

### Kachel-Anordnung innerhalb der Inseln

Die hexagonalen Kacheln werden **horizontal von links nach rechts** innerhalb jeder Insel angeordnet:

1. **Reihenfolge**: Kacheln werden in der Reihenfolge eingefügt, wie sie in der JSON-Datei definiert sind
2. **Zeilen automatisch**: Bei Erreichen der `width` (Spaltenanzahl) wird automatisch in die nächste Zeile gewechselt
3. **Hexagonaler Versatz**: Ungerade Spalten (2., 4., 6., etc.) werden automatisch um eine halbe Kachelhöhe nach unten versetzt für den typischen Hexagon-Look

### Placeholder verwenden

**Placeholder sind für das Spacing da!** Sie erstellen leere Positionen im Grid:

```json
"p1": {
  "placeholder": true
}
```

- Placeholder sind **unsichtbar** und **nicht interaktiv**
- Sie belegen einen Grid-Platz und "verschieben" nachfolgende Kacheln
- Nutzung zum **Positionieren** von Skills innerhalb der Insel
- Benenne sie `p1`, `p2`, etc. für bessere Übersicht

### Beispiel-Anordnung

Bei `"width": 4` entsteht folgendes 4-spaltiges hexagonales Grid innerhalb einer Insel:

```
Position:  1    2    3    4
Zeile 1:  [A]  [p1] [B]  [C]    ← p1 schiebt B und C nach rechts
Zeile 2:    [D]  [E]  [F]  [G]  ← Zeile 2 ist um halbe Höhe versetzt
Zeile 3:  [H]  [I]  [p2] [J]    ← p2 schiebt J nach rechts
```

### Skill-Properties

```json
"Skill Name": {
  "what": "Beschreibung was das ist",
  "why": "Erklärung warum das wichtig ist", 
  "important": true,    // Optionale Markierung als wichtige Fähigkeit (⭐)
  "dynamic": true       // Optionale Markierung für hohe Dynamik (🚀)
}
```

## Dateien

- `index.html` - Haupt-HTML-Struktur
- `app.js` - JavaScript-Logik (Pan/Zoom, Modal, Grid-Erstellung)
- `style.css` - CSS-Styling (Hexagon-Grid, Responsivität)
- `skills.json` - Datenquelle mit allen Skills und Kategorien

## Technische Details

- Verwendet **CSS Grid** für hexagonale Anordnung
- **Pointer Events API** für Pan & Zoom
- **Tailwind CSS** für Styling
- Responsive Design mit Touch-Unterstützung
- Accessibility Features (ARIA, Keyboard Navigation)