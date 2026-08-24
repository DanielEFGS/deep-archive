# Product definition — DEEP

Status: Draft v0.1  
Date: 2026-08-24  
Decision owner: DG

## 1. Product in one sentence

DEEP is an interactive visual archive for learning how to observe and interpret astronomical imagery.

Current edition: **DEEP / 1000**. The number describes the present collection, not the permanent product name. The repository and scalable platform name remain **deep-archive**.

## 2. The problem

Astronomical image libraries are excellent at storing and retrieving media, but a curious non-expert often encounters an impressive image without an accessible way to answer:

- What am I actually seeing?
- What should I look at first?
- Are these colors literal, mapped or composited?
- How was the image captured?
- Why does this object matter?
- What should I explore next?

The result is visual fascination without durable understanding. DEEP should bridge that gap without attempting to replace NASA search, scientific databases or formal astronomy courses.

## 3. Primary audience

### Primary

Visually curious learners aged roughly 16 and above who are attracted to space imagery but do not have specialist astronomy knowledge.

### Secondary

- secondary and higher-education students;
- educators seeking credible, attributable visual material;
- photographers, designers and people interested in visual culture.

### Tertiary

Frontend and creative-technology practitioners interested in the archive as an interaction and performance case study.

The learning experience is designed for the primary audience. Technical implementation notes may serve the tertiary audience, but they must not compete with the main product experience.

## 4. Jobs to be done

1. When a space image catches my attention, help me understand what I am seeing without requiring me to decode a technical article.
2. When I want to learn, guide me through related images so that isolated facts become a coherent mental model.
3. When I teach or share an image, give me a credible, attributable explanation and a stable link.
4. When I return casually, give me a meaningful new point of entry without requiring an account.

## 5. Product promise

English promise:

> An interactive visual archive for learning how to read the universe.

Spanish promise:

> Un archivo visual interactivo para aprender a observar el universo.

Supporting line:

> One thousand images, curated into paths that reveal how astronomical images are made, what they show and why they matter.

## 6. Positioning

For curious people who are drawn to astronomical imagery, DEEP is a free interactive archive that turns visual exploration into guided understanding. Unlike a conventional media library, it presents a finite, curated field and teaches the visitor what to notice, how an image was produced and where to go next.

## 7. Experience loop

The core loop is:

```text
Attract → Focus → Observe → Understand → Connect → Share or continue
```

- **Attract:** the continuous field creates curiosity and invites exploration.
- **Focus:** one tile becomes the unambiguous current object.
- **Observe:** a short prompt asks the visitor to look before explaining.
- **Understand:** concise context explains the object, image process and significance.
- **Connect:** the interface offers a meaningful related object or a guided Trail.
- **Share or continue:** the current state has a stable link and no account requirement.

The gallery is therefore the product's invitation, not its complete value. The transition from looking to understanding is the product's central responsibility.

## 8. Product pillars

### Visual first

Start from the image and preserve room to inspect it. Text supports observation rather than covering or replacing it.

### Guided, not encyclopedic

Prefer one strong observation prompt and a concise explanation over a wall of undifferentiated metadata.

### Connected knowledge

Every enriched object should lead somewhere meaningful: a related object, concept or Trail.

### Trustworthy provenance

Scientific claims must be source-checked. Credits, source links, image type and rights-review state remain visible and accurate. DEEP must never imply NASA affiliation or endorsement.

### Finite and curated

The value is not the largest possible catalog. It is a deliberate selection that a visitor can gradually understand.

### Free and low-friction

Core learning, sharing and saved local collections require no account, payment or behavioral profiling.

### Technical craft in service of meaning

WebGL, motion and visual effects should make relationships easier to perceive. They are not a substitute for editorial value and must respect performance, accessibility and reduced-motion preferences.

## 9. Personality and editorial tone

DEEP should feel like a contemporary observatory crossed with an independent visual publication.

It is:

- precise, restrained and curious;
- mysterious without becoming cryptic;
- technically sophisticated without sounding self-congratulatory;
- accessible without becoming childish;
- cinematic in moments, quiet during reading.

It should avoid:

- generic science-fiction interfaces;
- excessive HUD decoration and constant motion;
- NASA-like institutional branding;
- sensational or misleading scientific claims;
- gamification that rewards clicking rather than comprehension;
- unreviewed AI-generated explanations presented as fact.

## 10. Editorial object contract

An editorially enriched object should answer five questions:

1. **What is it?** A plain-language identification.
2. **What should I notice?** One to three observation prompts visible before or alongside the explanation.
3. **How was this view made?** Telescope, instrument, wavelength, color method or image type when evidence exists.
4. **Why does it matter?** A concise scientific or historical reason.
5. **Where can I verify or continue?** Original source, credit and a meaningful related object or Trail.

Content states should be explicit:

```text
official source metadata → source-checked draft → DG editorial approval → publishable
```

The initial release does not have a qualified astronomy reviewer. Explanations must therefore remain closely derived from attributable primary or institutional sources, avoid unsupported interpretation and use the label **source-checked**, never **scientifically reviewed**. DG approves clarity, tone and publication, but that approval is not represented as scientific validation.

## 11. First validation slice

Before enriching 30–50 records, build a small end-to-end pilot:

- 12 rights-cleared, visually varied objects;
- 1 guided Trail containing 6–8 of those objects;
- observation prompt, concise explanation, image-process context and related-object link for each featured object;
- stable URLs for the Trail and its steps;
- keyboard, touch and reduced-motion support;
- English source metadata and editorial content;
- no behavioral analytics during the pilot.

Recommended first Trail: **How Space Gets Its Colors**. It directly teaches visual literacy, works across multiple object categories and gives DEEP a more distinctive proposition than a conventional object taxonomy.

## 12. MVP boundary

The first public learning release is complete when it includes:

- 30 editorially enriched and rights-cleared records;
- 3 reviewed Trails of 5–10 records each;
- observation-first object detail;
- related-object navigation;
- shareable object and Trail URLs with useful social metadata;
- preserved source and credit information;
- accessible mouse, touch and keyboard operation;
- a static Netlify deployment that preserves the atlas architecture and on-demand HD loading.

The validation slice precedes this MVP and exists to test the proposition before scaling editorial production.

## 13. Explicit non-goals

- replacing NASA's media search or scientific databases;
- publishing explanations for all 1,000 records in the first release;
- user accounts, public profiles, comments, likes or rankings;
- an internal social network or feed;
- runtime dependence on NASA APIs;
- citizen-science claims;
- Compare, collections or education-mode features before the Learn proposition is validated.

## 14. Success model

### North-star behavior

A **meaningful exploration session** is a visit in which a person either:

- opens at least three objects and follows at least one contextual connection; or
- completes at least half of a guided Trail.

This is a product hypothesis, not yet a fixed analytics specification.

### Supporting signals

- Trail starts and completion rate;
- continuation from one object to a related object;
- observation prompts revealed before explanatory text;
- object or Trail links shared;
- return visits to recurring entry points;
- short optional comprehension feedback after a Trail.

### Guardrails

- no increase to one initial request per gallery tile;
- no permanent idle render loop;
- no publication of rights-review failures;
- no loss of keyboard, touch or reduced-motion support;
- no metric that requires identity, accounts or invasive tracking.

## 15. Product hypotheses to validate

1. An observation prompt followed by explanation produces deeper exploration than metadata alone.
2. A finite curated archive reduces decision fatigue compared with open-ended search.
3. Trails create a stronger reason to return and share than isolated detail views.
4. Carefully edited Spanish and Japanese layers can later broaden access without weakening the initial English editorial standard.
5. Compare and collection tools will have more value after visitors understand the objects they are manipulating.

## 16. Principal risks

- the visual interaction may overshadow the educational value;
- source interpretation may introduce inaccuracies while no qualified scientific reviewer is available;
- third-party rights may reduce the usable featured subset;
- multilingual quality may exceed available editorial capacity;
- the desktop interaction may not translate into an equally legible mobile learning loop;
- measuring novelty clicks as success may lead the product in the wrong direction.

## 17. Approved product decisions

1. Use **DEEP** as the permanent product name and **DEEP / 1000** as the current edition.
2. Design primarily for curious non-specialists aged 16+, with educators as the main secondary audience.
3. Use **How Space Gets Its Colors** as the first Trail.
4. Maintain English and Spanish as separately reviewed editorial layers. Treat Japanese as planned, and never substitute automatic translations for reviewed editorial or supplied source metadata.
5. Target an informed general-reader level, avoiding both specialist shorthand and child-oriented simplification.
6. Use the completed bilingual 12-object pilot to validate the learning experience before committing to the 30-record MVP subset.
7. Attribute the independent project publicly to **DG**. The About view links to [GitHub](https://github.com/DanielEFGS) and [LinkedIn](https://www.linkedin.com/in/daniel-garcia-silva-695086213/); email is not required.
8. Publish content as **source-checked** under DG's editorial approval. Do not claim scientific review unless a qualified reviewer participates later.
9. Do not add behavioral analytics to the pilot. Reconsider aggregate, privacy-conscious measurement only when there is a concrete validation question.

## 18. Decisions still needed

- What evidence will be considered sufficient to proceed from Learn to Compare?
- What review protocol should be added if a qualified astronomy contributor joins later?

The next product task is to define the first Trail's learning objective and select its 12-object pilot set.
