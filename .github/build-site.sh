#!/usr/bin/env bash
# Baut die Pages-Seite zusammen: main in die Wurzel, jeder andere Branch
# unter /previews/<branch>/, dazu eine Übersichtsseite. Wird von
# .github/workflows/pages.yml aufgerufen — lässt sich aber auch lokal
# ausführen (DEFAULT_BRANCH=main bash .github/build-site.sh) und dann in
# _site/ anschauen.
set -euo pipefail

DEFAULT="${DEFAULT_BRANCH:-main}"
OUT="${1:-_site}"

rm -rf "$OUT"
mkdir -p "$OUT/previews"

# --- Wurzel = Standard-Branch --------------------------------------------
git archive "origin/$DEFAULT" | tar -x -C "$OUT"
rm -rf "$OUT/.github"

# --- Vorschauen: jeder andere Branch --------------------------------------
BRANCHES=$(git for-each-ref --format='%(refname:strip=3)' refs/remotes/origin \
           | grep -vx 'HEAD' | grep -vx "$DEFAULT" || true)

for b in $BRANCHES; do
  echo "Vorschau: $b"
  mkdir -p "$OUT/previews/$b"
  git archive "origin/$b" | tar -x -C "$OUT/previews/$b"
  rm -rf "$OUT/previews/$b/.github"
done

# --- Übersichtsseite -------------------------------------------------------
{
  cat <<HTML
<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Branch-Vorschauen</title><style>
body{font-family:system-ui,-apple-system,sans-serif;background:#EFEDE8;color:#1B1F26;
  margin:0;padding:48px 20px;display:flex;justify-content:center}
.w{max-width:640px;width:100%}
h1{font-size:1.5rem;margin:0 0 6px}
p{color:#5A6472;margin:0 0 26px;line-height:1.5}
a.b{display:block;background:#fff;border-radius:14px;padding:16px 18px;margin-bottom:10px;
  text-decoration:none;color:#1B1F26;font-weight:700;border-left:5px solid #EC0016}
a.b:hover{background:#FFFDF7}
small{display:block;font-weight:400;color:#5A6472;margin-top:3px}
</style></head><body><div class="w">
<h1>Branch-Vorschauen</h1>
<p>Jeder Branch dieses Repositories als eigene Seite — zum Anschauen, bevor
etwas nach <b>$DEFAULT</b> wandert. Die Live-Seite liegt <a href="../">eine Ebene höher</a>.</p>
HTML
  if [ -z "$BRANCHES" ]; then
    echo '<p>Zurzeit gibt es außer dem Standard-Branch nichts zu sehen.</p>'
  else
    for b in $BRANCHES; do
      printf '<a class="b" href="./%s/">%s<small>previews/%s/</small></a>\n' "$b" "$b" "$b"
    done
  fi
  echo '</div></body></html>'
} > "$OUT/previews/index.html"

echo "Fertig: $(find "$OUT" -type f | wc -l) Dateien in $OUT/"
