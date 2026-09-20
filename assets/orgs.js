/* Country adoptee associations. "live" = URL returned real content when last checked (Sept 2026). */
(function () {
  const ORGS = [
    { c: 'Sweden', n: 'AKF — Adopterade Koreaners Förening', u: 'https://www.ikaa.org/portfolio/akf/', note: 'Founded 19 Nov 1986 in Stockholm — the first Korean adoptee association in the world. ~300 members.' },
    { c: 'Sweden', n: 'SKAN — Swedish Korean Adoptees Network', u: 'https://swedishkoreanadopteesnetwork.wordpress.com/', note: 'Rights group; represented before Korea’s Truth and Reconciliation Commission.' },
    { c: 'Denmark', n: 'Korea Klubben', u: 'https://www.koreaklubben.dk/', note: 'Long-running Danish community for Korean adoptees: language, culture, events.' },
    { c: 'Denmark', n: 'Adoptionspolitisk Forum', u: 'https://www.adoptionspolitiskforum.org/', note: 'Danish adoption policy and reform forum.' },
    { c: 'Denmark', n: 'DKRG — Danish Korean Rights Group', u: null, note: 'Filed the complaints that triggered Korea’s 2022 truth commission investigation. Reachable through KoRoot; no standing public site found.' },
    { c: 'Netherlands', n: 'Arierang', u: 'https://arierang.nl/', note: 'Dutch association of Korean adoptees.' },
    { c: 'France', n: 'Racines Coréennes', u: 'https://racinescoreennes.org/', note: 'The main French Korean adoptee association, active since the 1990s.' },
    { c: 'France / BE / CH', n: 'FKRG — Francophones Korean Rights Group', u: 'https://francophoneskrg.wordpress.com/', note: 'Francophone adoptee rights group working with KoRoot.' },
    { c: 'Belgium', n: 'CAFE — Critical Adoptees Front Europe', u: 'https://c-a-f-e.be/', note: 'Belgian adoptee-led advocacy organisation.' },
    { c: 'Germany', n: 'Koreanische Adoptierte Deutschland e.V.', u: 'https://kadev.org/', note: 'German association of Korean adoptees.' },
    { c: 'Switzerland', n: 'Dongari', u: 'https://dongari.ch/', note: 'Swiss Korean adoptee association.' },
    { c: 'Norway', n: 'NKRG — Norsk-Koreansk Rettighetsgruppe', u: 'https://nkrg.no/', note: 'Norwegian Korean rights group. Norway ran its own state inquiry into overseas adoption.' },
    { c: 'Australia', n: 'KAIAN — Korean Adoptees in Australia Network', u: 'https://www.kaian.org.au/', note: 'Australian network for Korean adoptees.' },
    { c: 'Australia / US', n: 'AUSKRG', u: null, note: 'Represented by KoRoot before Korea’s truth commission, but its website was empty when last checked. Contact via KoRoot.' },
    { c: 'United States', n: 'Alliance For Adoptee Citizenship', u: 'https://www.allianceforadopteecitizenship.org/', note: 'Coalition working on citizenship for intercountry adoptees.' },
    { c: 'Italy', n: 'Associazione Culturale Koreani Italiani Adottivi', u: null, note: 'Listed in adoptee directories; no verified public site found.' },
    { c: 'United Kingdom', n: 'BritKADs', u: null, note: 'Community group named in adoptee directories; no verified public site found.' },
  ];

  const esc = ATA.esc;
  const rows = ORGS.map(o => `<tr>
      <td>${esc(o.c)}</td>
      <td><b>${esc(o.n)}</b><div class="small muted">${o.note}</div></td>
      <td style="text-align:left;white-space:nowrap">${o.u
        ? `<a href="${esc(o.u)}" target="_blank" rel="noopener">Visit &rarr;</a>`
        : '<span class="small muted">no site</span>'}</td>
    </tr>`).join('');

  const el = document.getElementById('countryorgs');
  if (el) el.innerHTML = `<table class="data">
      <thead><tr><th>Country</th><th>Organisation</th><th style="text-align:left">Link</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
})();
