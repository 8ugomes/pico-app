# PULSO — prompts e procedência

Proposta visual exploratória de Pico Social. Gerada com a ferramenta nativa `image_gen`; sem CLI, sem fotografia de pessoas reais e sem edição posterior dos pixels por código.

## board.png

Use case: logo-brand
Asset type: premium identity proposal board for Pico Social, a Brazilian community app for people who play beach volleyball, footvolley and beach tennis.
Primary request: create one refined, bold, youthful, sports-fashion editorial brand identity overview. Landscape 16:10 canvas. The direction is called PULSO internally; do not write that name on the image. Convey collective momentum and the expressive gesture of the game, grounded in Brazilian urban sand-court culture.
Logo: original lowercase "pico" wordmark, compact bold grotesque custom lettering with subtle intentional motion cuts; the four letters must stay clearly legible. A separate simple P symbol made from one ascending gesture and one circle, ownable and highly reduced. Repeat exactly the same mark and lettering across applications. No copied brand logos.
Layout: an intentional asymmetrical editorial presentation grid with precise alignment, generous gutters and clear scale hierarchy, like an identity case study by a serious design studio. An enormous ice-white "pico" wordmark anchors a dominant cobalt panel. Include a striking realistic photographic crop of an adult playing beach volleyball on an urban sand court, a quiet geometric symbol study, disciplined color swatches without labels, one app icon, two small navy mobile app screens with photography and very sparse abstract visual elements, and one sports editorial poster application. Treat mobile screens as conceptual visual applications, not feature demos. No charts or invented metrics. Some panels quiet, some energetic. Strong negative space. No glossy device mockups, no decorative dashboard chrome.
Style/medium: premium sports fashion editorial, bold refined graphic design, matte surfaces, restrained print texture, carefully art-directed photography, natural realistic human anatomy.
Color palette: dominant cobalt #254CF1, deep night navy #101735, ice #EDF2FA, sparing pale lime #D9F56E. Flat clear colors, no neon glow.
Text (verbatim, and only these words): "pico", "SOCIAL", "Me acha no Pico". Keep text very sparse, large enough to read. No page numbers, no palette values, no other labels, no tiny fake body copy.
Avoid: social counts, followers, online status, check-in data, booking/payment UI, unrelated brands, robots, fintech aesthetics, cyberpunk, neon, stock-photo smiles, messy moodboard clutter, illegible lettering.

## photo.png

Use case: photorealistic-natural
Asset type: synthetic editorial photograph for Pico Social PULSO concept mockups.
Primary request: a vertical 4:5 sports-fashion editorial photograph, without any text, logos or interface. A Brazilian Black adult man playing beach volleyball at night on an urban sand court. He wears a simple cobalt-blue sleeveless athletic top and matching practical blue shorts, unbranded. Capture a credible natural expressive volleyball action: a low forward lunge with both forearms joined in a textbook forearm pass, eyes following the ball just above his forearms, grounded athletic tension rather than a staged heroic pose. Show two arms and two legs with realistic joint positions; anatomically accurate hands and forearms.
Scene/backdrop: urban outdoor sand court at night, volleyball net and a few other adult players softly out of focus in the background. No recognizable venue, no text on signs, no commercial brands. Include the sand and action context, not a studio backdrop.
Composition/framing: portrait 4:5, mid-to-full body frame from a slightly low sideline camera angle, decisive editorial crop, space around the moving hands and ball, foreground sand texture and a small natural spray of sand. The subject feels observed in play, never posed for stock photography.
Lighting/mood: cool white court floodlights with a controlled direct photographic flash, deep navy shadows, rich natural dark skin tones, crisp face and arms, lightly blurred background, restrained realistic contrast. Modern night sports editorial, youthful and candid.
Color palette: cobalt blue uniform, deep night navy surroundings, cool ice highlights, natural beige sand. No neon colors or cyberpunk lighting.
Materials/textures: sweat sheen, jersey fabric, natural skin texture, granular sand. Realistic photography, not CGI or illustration.
Constraints: all people clearly adults; no text, no wordmark, no logo, no watermark, no interface, no badges, no numbers; no extra limbs, malformed anatomy, repeated faces, exaggerated muscles, or stock advertising smile.

## Correção nativa de board.png

A primeira saída da prancha trouxe transparência indesejada e ruído nos limites dos painéis. Uma edição nativa corrigiu esse defeito. A imagem de entrada foi a primeira geração, inspecionada antes da edição.

Use case: precise-object-edit.
This image is the edit target, a finished Pico Social PULSO brand identity proposal. Correct ONLY the output defects: remove every transparent area, dirty pixel edge and glitch artifact from the top-left cobalt panel and all gutters between the panels. Make the whole 16:10 canvas fully opaque, with clean solid cobalt #254CF1 in the large top-left panel and clean solid ice #EDF2FA narrow gutters. Keep every original panel position, shape, dimension, wordmark, logo, photograph, symbol, text and color otherwise unchanged. Preserve the exact lowercase pico lettering, SOCIAL, and Me acha no Pico. Keep realistic photographs. No extra text or elements. This must look like a clean print-ready brand identity presentation with crisp edges. Opaque PNG; no alpha transparency or distressed border effects anywhere.

## Arquivos e limites

- `board.png`: 1586 × 992 px, cerca de 16:10. Fonte final: `/Users/8ugo/.codex/generated_images/01a098b9-3992-7fe2-a371-7cd3394e6f81/exec-c76ef09e-bd57-4aba-87b8-7b753ae2d07d.png`.
- `photo.png`: 1122 × 1402 px, cerca de 4:5. Fonte: `/Users/8ugo/.codex/generated_images/01a098b9-3992-7fe2-a371-7cd3394e6f81/exec-08f8de61-8f1c-4810-8f96-de7b2c57498f.png`.
- Prancha: estudo raster de direção. As miniaturas móveis são aplicações editoriais conceituais, não telas funcionais. O lettering e o símbolo exigem desenho vetorial e refinamento antes de uso como identidade final.
- Fotografia: imagem sintética com adultos fictícios; não representa uma pessoa, comunidade ou arena cadastrada. É material ilustrativo para mockups.
- Cores no raster são aproximações visuais; os valores hexadecimais do briefing definem os tokens de uma futura implementação.
- Inspeção visual: lettering e slogan legíveis, símbolo consistente, paleta cobalto/noite/gelo/lima, fotografia sem texto ou marcas, cenário e anatomia plausíveis. Transparência e ruído da primeira prancha foram corrigidos pela edição nativa.
