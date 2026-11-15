import { LEGAL } from './company';

export type LegalBlock = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type LegalDoc = { slug: 'privatliv' | 'cookies' | 'vilkaar'; title: string; summary: string; blocks: LegalBlock[] };

const { brand, operators, email, phone } = LEGAL;

/** Name and contact details, with CVR and address only when they have been filled in. */
function whoWeAre(): string[] {
  const lines = [`${brand} drives af ${operators}.`];
  if (LEGAL.cvr) lines.push(`CVR-nr.: ${LEGAL.cvr}.`);
  if (LEGAL.address) lines.push(`Adresse: ${LEGAL.address}.`);
  lines.push(`E-mail: ${email}. Telefon: ${phone}.`);
  return lines;
}

const contactBlock: LegalBlock = {
  heading: 'Kontakt',
  paragraphs: [`Har du spørgsmål til dette dokument eller til dine oplysninger, er du velkommen til at skrive til os på ${email}.`],
};

export const privacy: LegalDoc = {
  slug: 'privatliv',
  title: 'Privatlivspolitik',
  summary:
    'Her kan du læse, hvilke oplysninger vi behandler om dig, hvorfor vi gør det, og hvilke rettigheder du har.',
  blocks: [
    {
      heading: 'Hvem er ansvarlig for dine oplysninger?',
      paragraphs: [
        ...whoWeAre(),
        `Vi er dataansvarlige for de personoplysninger, der behandles, når du bruger ${brand}-appen og hjemmesiden.`,
      ],
    },
    {
      heading: 'Hvilke oplysninger behandler vi?',
      bullets: [
        'Konto: din e-mailadresse, din rolle (kunde eller hjælper) og tidspunktet for oprettelsen. Din adgangskode gemmes aldrig i klartekst, kun som en saltet hash (PBKDF2-SHA-256).',
        'Login: et tilfældigt sessions-token. På vores server gemmes kun en hash af tokenet, og sessionen er gyldig i højst 30 dage.',
        'Opgaver og tilbud: det, du selv skriver, fx titel, beskrivelse, pris og besked. Skriv ikke følsomme oplysninger (fx helbredsforhold eller CPR-nummer) i opgaver eller beskeder.',
        'Misbrugsbeskyttelse: din IP-adresse og din e-mailadresse bruges til midlertidigt at tælle login- og oprettelsesforsøg (højst 5 forsøg pr. 15 minutter). Tællerne gælder i 15 minutter og ryddes op ved senere forsøg.',
        'Din placering: hvis du giver tilladelse, bruger vi din enheds placering, ellers den by du selv skriver, til at finde virksomheder i nærheden. Placeringen sendes til vores server som søgepunkt og gemmes ikke på din konto.',
      ],
    },
    {
      heading: 'Hvad bruger vi oplysningerne til, og på hvilket grundlag?',
      bullets: [
        'At oprette din konto og levere tjenesten (opgaver, tilbud og søgning): behandlingen er nødvendig for at opfylde aftalen med dig (GDPR art. 6, stk. 1, litra b).',
        'At beskytte tjenesten mod misbrug og holde den sikker, fx ved at begrænse gentagne loginforsøg: vores legitime interesse (art. 6, stk. 1, litra f).',
        'At bruge din placering: dit samtykke, som du giver via enhedens eller browserens tilladelse (art. 6, stk. 1, litra a). Du kan til enhver tid trække det tilbage i enhedens indstillinger og i stedet skrive en by.',
        'At vise oplysninger om lokale virksomheder: vores legitime interesse i at hjælpe borgere med at finde lokal hjælp (art. 6, stk. 1, litra f).',
      ],
    },
    {
      heading: 'Oplysninger om virksomheder og selvstændige',
      paragraphs: [
        'De virksomheder, der vises i søgningen, er ikke brugere hos os. Vi henter offentligt tilgængelige oplysninger (navn, branche, adresse, telefonnummer, e-mailadresse og hjemmeside) fra OpenStreetMap og fra virksomhedernes egne offentlige hjemmesider, hvor vi kun læser kontaktoplysninger. For enkeltmandsvirksomheder kan det være personoplysninger.',
        'Vi læser kun en virksomheds hjemmeside, hvis dens robots.txt tillader det.',
        `Er du virksomhedsejer og vil have oplysninger rettet eller fjernet, så skriv til os på ${email}. Kortdata rettes bedst direkte i OpenStreetMap, så ændringen også gælder andre steder.`,
      ],
    },
    {
      heading: 'Hvem får oplysningerne?',
      bullets: [
        'Cloudflare: hosting, database og levering af hjemmesiden. Cloudflare er vores databehandler.',
        'OpenStreetMap-tjenester: når du søger, sender vores server et søgepunkt (koordinater) til OpenStreetMaps åbne kortservere, og en by, du skriver, sendes til geokodningstjenesten Nominatim. Din e-mailadresse og andre kontooplysninger sendes ikke med.',
        'Andre brugere: dine opgaver og tilbud er synlige for de relevante parter på platformen.',
      ],
      paragraphs: ['Vi sælger ikke dine oplysninger og bruger dem ikke til markedsføring.'],
    },
    {
      heading: 'Overførsel til lande uden for EU/EØS',
      paragraphs: [
        'Cloudflare er en amerikansk virksomhed, så oplysninger kan blive behandlet uden for EU/EØS. Det sker på grundlag af de overførselsmekanismer, Cloudflare anvender, fx EU-Kommissionens standardkontraktbestemmelser.',
      ],
    },
    {
      heading: 'Hvor længe gemmer vi oplysningerne?',
      bullets: [
        'Konto, opgaver og tilbud: indtil du beder os slette dem.',
        'Sessioner: en session er gyldig i højst 30 dage og ophører, når du logger ud. Udløbne sessioner kan ikke bruges, men selve registreringen kan blive liggende i databasen, indtil den ryddes op. Vi sletter den på din anmodning.',
        'Login-tællere: tællerne gælder i 15 minutter. De ryddes op ved senere login-forsøg og kan derfor blive liggende lidt længere i databasen.',
        'Virksomhedsoplysninger: opdateres, når et område søges igen. Oplysninger, der ikke har kunnet bekræftes i cirka 14 dage, skjules i søgningen. De slettes, når området næste gang opdateres, og kan midlertidigt vises igen, hvis vores kortkilder ikke svarer. Vi sletter dem på din anmodning.',
      ],
    },
    {
      heading: 'Dine rettigheder',
      bullets: [
        'Ret til indsigt i de oplysninger, vi har om dig.',
        'Ret til at få urigtige oplysninger rettet.',
        'Ret til sletning ("retten til at blive glemt").',
        'Ret til at begrænse behandlingen.',
        'Ret til at få dine oplysninger udleveret i et almindeligt format (dataportabilitet).',
        'Ret til at gøre indsigelse mod behandling, der bygger på vores legitime interesse.',
        'Ret til at trække et samtykke tilbage.',
      ],
      paragraphs: [
        `Skriv til ${email}, hvis du vil bruge dine rettigheder. Vi svarer senest inden for en måned. Der er endnu ikke en slettefunktion i appen, så skriv til os, hvis du vil have din konto og dine data slettet.`,
        'Du kan klage over vores behandling af dine oplysninger til Datatilsynet (www.datatilsynet.dk).',
      ],
    },
    {
      heading: 'Sikkerhed',
      paragraphs: [
        'Forbindelsen til tjenesten er krypteret (HTTPS), adgangskoder gemmes som hash, og sessions-tokens gemmes som hash på serveren. Intet system er dog helt sikkert, så vælg en lang og unik adgangskode.',
      ],
    },
    {
      heading: 'Børn og unge',
      paragraphs: [`${brand} er til personer på 18 år og derover.`],
    },
    {
      heading: 'Ændringer',
      paragraphs: ['Vi kan opdatere denne politik. Datoen øverst på siden viser, hvornår den sidst er ændret.'],
    },
    contactBlock,
  ],
};

export const cookies: LegalDoc = {
  slug: 'cookies',
  title: 'Cookiepolitik',
  summary: 'Kort fortalt: vi bruger ingen cookies og ingen sporing.',
  blocks: [
    {
      heading: 'Kort fortalt',
      paragraphs: [
        `${brand} bruger ingen cookies, og vi bruger ingen analyse-, statistik- eller markedsføringsværktøjer. Derfor har vi heller ikke noget cookiebanner.`,
      ],
    },
    {
      heading: 'Hvad gemmer vi på din enhed?',
      bullets: [
        'Login-token: når du logger ind, gemmes et token, så du ikke skal logge ind igen hver gang. I appen ligger det i enhedens sikre lager. På hjemmesiden ligger det i browserens lokale lager (localStorage). Det er teknisk nødvendigt for, at du kan være logget ind.',
        'Intet andet: dit temavalg, dine gemte virksomheder og din placering gemmes ikke varigt.',
      ],
    },
    {
      heading: 'Kræver det samtykke?',
      paragraphs: [
        'Nej. Lagring, der er strengt nødvendig for en tjeneste, du selv beder om, kræver ikke samtykke efter cookiereglerne. Skulle vi senere indføre noget, der ikke er nødvendigt, fx statistik, beder vi om dit samtykke først.',
      ],
    },
    {
      heading: 'Tredjeparter',
      paragraphs: [
        'Vi indlejrer ikke indhold fra tredjeparter som kort, videoer eller sociale medier. Skrifttyper og billeder leveres fra selve appen. Vores hostingudbyder, Cloudflare, behandler tekniske oplysninger som din IP-adresse, når siden leveres til dig.',
      ],
    },
    {
      heading: 'Sådan fjerner du det',
      paragraphs: ['Log ud i appen, eller ryd webstedets data i din browser. Så fjernes login-tokenet fra din enhed.'],
    },
    contactBlock,
  ],
};

export const terms: LegalDoc = {
  slug: 'vilkaar',
  title: 'Vilkår og betingelser',
  summary: `Disse vilkår gælder for din brug af ${brand}.`,
  blocks: [
    {
      heading: 'Hvem er vi, og hvad er Håndmatch?',
      paragraphs: [
        ...whoWeAre(),
        `${brand} er en digital platform, der hjælper dig med at finde lokale virksomheder og selvstændige og med at oprette opgaver og modtage tilbud. Ved at oprette en konto eller bruge tjenesten accepterer du disse vilkår.`,
      ],
    },
    {
      heading: 'Vi er en formidler, ikke leverandør',
      paragraphs: [
        `${brand} leverer ikke selv de ydelser, der tilbydes, og vi er ikke part i aftaler mellem brugere og virksomheder. En aftale om en opgave indgås direkte mellem dig og virksomheden. Vi garanterer ikke kvalitet, pris, tidspunkt eller fremmøde, og vi håndterer ikke betaling.`,
      ],
    },
    {
      heading: 'Tidlig version',
      paragraphs: [
        `${brand} er under udvikling. Funktioner kan ændres, afbrydes eller fjernes, og der kan forekomme fejl og driftsforstyrrelser. Tjenesten er pt. gratis at bruge.`,
      ],
    },
    {
      heading: 'Din konto',
      bullets: [
        'Du skal være mindst 18 år.',
        'Du skal give korrekte oplysninger og holde din adgangskode hemmelig.',
        'Du er ansvarlig for det, der sker på din konto. Giv os besked, hvis du tror, at andre har fået adgang.',
        'Du vælger ved oprettelsen, om du søger hjælp (kunde) eller tilbyder hjælp (hjælper).',
      ],
    },
    {
      heading: 'Opgaver, tilbud og dit indhold',
      bullets: [
        'Du er ansvarlig for det indhold, du skriver, fx opgaver, tilbud og beskeder.',
        'Indholdet må ikke være ulovligt, krænkende, vildledende eller spam, og du må ikke bruge tjenesten til at chikanere andre.',
        'Du må ikke forsøge at misbruge eller belaste tjenesten, fx ved automatisk indsamling af data eller forsøg på at omgå sikkerheden.',
        'Du giver os ret til at vise dit indhold i tjenesten over for de relevante parter.',
        'Vi kan fjerne indhold og spærre konti, hvis vilkårene overtrædes.',
      ],
    },
    {
      heading: 'Virksomhedsoplysninger og kortdata',
      paragraphs: [
        'Oplysningerne om virksomheder hentes fra OpenStreetMap (© OpenStreetMap-bidragydere, tilgængelige under ODbL-licensen) og fra virksomhedernes egne offentlige hjemmesider. De kan være ufuldstændige eller forældede, og vi viser ikke anmeldelser eller priser, medmindre det fremgår.',
        'At en virksomhed vises i Håndmatch, er ikke en anbefaling, og vi har ingen tilknytning til virksomhederne, medmindre andet fremgår. Kontrollér selv virksomhedens oplysninger, fx autorisation, forsikring og pris, før du indgår en aftale.',
      ],
    },
    {
      heading: 'Pris og betaling',
      paragraphs: [
        'Priser i tilbud sættes af virksomhederne. Aftale og betaling sker direkte mellem dig og virksomheden og ikke via Håndmatch.',
      ],
    },
    {
      heading: 'Dine rettigheder som forbruger',
      paragraphs: [
        'Dine lovbestemte rettigheder over for en virksomhed, fx reklamation og fortrydelsesret, påvirkes ikke af disse vilkår. Klager over en virksomhed kan fx indbringes for Forbrugerklagenævnet (www.forbrugerklagenaevnet.dk), hvis betingelserne er opfyldt.',
      ],
    },
    {
      heading: 'Ansvar',
      paragraphs: [
        `Vi hæfter efter dansk rets almindelige regler. Vi er ikke ansvarlige for aftaler mellem brugere og virksomheder, for tredjeparters indhold og oplysninger eller for midlertidige driftsforstyrrelser. Vi er ikke ansvarlige for indirekte tab. Begrænsningerne gælder ikke, hvis vi har handlet forsætligt eller groft uagtsomt, eller hvor loven ikke tillader en begrænsning.`,
      ],
    },
    {
      heading: 'Rettigheder til appen',
      paragraphs: [
        `Kode, design, navn og logo tilhører ${operators}. Du må ikke kopiere eller videreudnytte dem uden vores tilladelse.`,
      ],
    },
    {
      heading: 'Afslutning af din konto',
      paragraphs: [
        `Du kan stoppe med at bruge ${brand} når som helst. Skriv til ${email}, hvis du vil have din konto slettet. Vi kan lukke eller spærre en konto ved misbrug eller brud på vilkårene.`,
      ],
    },
    {
      heading: 'Ændringer af vilkårene',
      paragraphs: [
        'Vi kan ændre vilkårene. Væsentlige ændringer varsler vi i tjenesten. Datoen øverst viser seneste opdatering, og fortsat brug efter en ændring betyder, at du accepterer de nye vilkår.',
      ],
    },
    {
      heading: 'Lovvalg og tvister',
      paragraphs: [
        'Vilkårene er underlagt dansk ret. Tvister afgøres ved de danske domstole efter de almindelige regler om værneting. Ufravigelige forbrugerrettigheder berøres ikke.',
      ],
    },
    contactBlock,
  ],
};

export const legalDocs: Record<LegalDoc['slug'], LegalDoc> = { privatliv: privacy, cookies, vilkaar: terms };
