export function parseResume(text) {

    const profile = {

        firstName: "",
        lastName: "",

        email: "",
        phone: "",

        address: "",
        city: "",
        stateProvince: "",
        country: "",
        postalCode: "",

        university: "",
        degree: "",
        major: "",
        graduationYear: "",

        currentCompany: "",

        linkedin: "",
        github: "",
        portfolio: ""

    };

    // ----------------------------
    // Normalise
    // ----------------------------

    // Split on real newlines only; keep lines that have content
    const lines = text
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    // ----------------------------
    // Section splitter
    // ----------------------------

    const SECTION_RE =
        /^(summary|objective|profile|about|education|academic background|qualifications|experience|work experience|professional experience|work history|employment|skills|technical skills|projects|certifications|awards|languages|publications|interests|volunteering|references)\s*$/i;

    function buildSections() {

        const map = {};           // sectionName → [lines]
        let current = "header";
        map[current] = [];

        for (const line of lines) {

            if (SECTION_RE.test(line) && line.length < 60) {

                current = line.toLowerCase().trim();
                map[current] = [];

            } else {

                map[current].push(line);

            }

        }

        return map;

    }

    const sections = buildSections();

    function getSection(...keywords) {

        for (const key of Object.keys(sections)) {
            for (const kw of keywords) {
                if (key.includes(kw)) return sections[key];
            }
        }

        return [];

    }

    const headerLines   = sections["header"]  || [];
    const eduLines      = getSection("education", "academic", "qualification");
    const expLines      = getSection("experience", "employment", "work history",
                                     "work experience", "professional");

    // Flatten helpers
    const headerText    = headerLines.join(" ");
    const eduText       = eduLines.join(" ");
    const expText       = expLines.join(" ");

    // ----------------------------
    // Email  (global — usually unique)
    // ----------------------------

    const emailMatch = text.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
    if (emailMatch) profile.email = emailMatch[0];

    // ----------------------------
    // Phone
    // Handles:  +92 325-941-8649 | (555) 123-4567 | 03001234567
    // ----------------------------

    const phoneMatch = text.match(
        /(\+?[\d][\d\s.\-()]{6,}[\d])(?=\s*[\|,\s]|$)/
    );
    if (phoneMatch) profile.phone = phoneMatch[0].trim();

    // ----------------------------
    // LinkedIn / GitHub / Portfolio
    // ----------------------------

    const linkedinMatch =
        text.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[^\s|,)>\n]+/i) ||
        text.match(/linkedin\.com\/in\/[^\s|,)>\n]+/i);
    if (linkedinMatch) profile.linkedin = linkedinMatch[0];

    const githubMatch =
        text.match(/https?:\/\/(www\.)?github\.com\/[^\s|,)>\n]+/i) ||
        text.match(/github\.com\/[^\s|,)>\n]+/i);
    if (githubMatch) profile.github = githubMatch[0];

    const allUrls = text.match(/https?:\/\/[^\s|,)>\n]+/g) || [];
    const portfolio = allUrls.find(u =>
        !u.includes("linkedin.com") && !u.includes("github.com")
    );
    if (portfolio) profile.portfolio = portfolio;

    // ----------------------------
    // Name
    // Strategy: scan the first header line (and second if needed).
    // PDF resumes put "FirstName LastName  phone | email | …" on one line.
    // We extract the leading word-sequence before any digit / @ / | / http.
    // ----------------------------

    function extractName(line) {

        // Strip everything from the first separator character onwards
        const cleaned = line
            .replace(/[\|•·].*/, "")          // pipe / bullet separators
            .replace(/\+?\d.*/, "")            // phone numbers
            .replace(/\S+@\S+/, "")            // email
            .replace(/https?:\/\/\S+/gi, "")   // URLs
            .trim();

        const words = cleaned.split(/\s+/).filter(Boolean);

        if (words.length < 2 || words.length > 5) return null;

        // Every word must be capitalised, letters/hyphens/apostrophes only
        const ok = words.every(w => /^[A-Z][a-zA-Z'\-]{0,30}$/.test(w));

        return ok ? words : null;

    }

    for (const line of headerLines.slice(0, 3)) {

        const words = extractName(line);

        if (words) {
            profile.firstName = words[0];
            profile.lastName  = words.slice(1).join(" ");
            break;
        }

    }

    // ----------------------------
    // Location fields
    // Only look inside the header section to avoid false matches.
    //
    // PDF resumes commonly produce:
    //   "COMSATS University Islamabad, Lahore Campus  Lahore, Pakistan"
    // The city/country pair we want is the LAST "Word, Word" on the line.
    // ----------------------------

    // Postal code — 4-6 digit code in header
    const postalMatch = headerText.match(/\b\d{4,6}\b/);
    if (postalMatch) profile.postalCode = postalMatch[0];

    // Street address — only match if there is an actual street keyword
    const streetMatch = headerText.match(
        /\d+\s[\w\s,.\-]*(street|st\.?|avenue|ave\.?|road|rd\.?|lane|ln\.?|drive|dr\.?|boulevard|blvd\.?|way|place|pl\.?|court|ct\.?|block)\b[^\n,]*/i
    );
    if (streetMatch) profile.address = streetMatch[0].trim();

    // City / State|Country
    // Find ALL "Word(s), Word(s)" pairs in the header and take the LAST one —
    // that is almost always the standalone "City, Country" line rather than
    // "University Name, Campus Name".
    const cityStateMatches = [...headerText.matchAll(
        /\b([A-Z][a-zA-Z\s]{1,25}),\s*([A-Z][a-zA-Z\s]{2,25})\b/g
    )];

    if (cityStateMatches.length) {

        // Take the last match — most likely to be "City, Country"
        const last = cityStateMatches[cityStateMatches.length - 1];
        const candidate = last[1].trim();
        const region    = last[2].trim();

        // Reject if it looks like a university/campus description
        const institutionWords =
            /university|college|institute|campus|school|academy/i;

        if (!institutionWords.test(candidate) &&
            !institutionWords.test(region)) {

            profile.city         = candidate;
            profile.stateProvince = region;

        }

    }

    // Country — matched against a broad list of country names/abbreviations.
    // Sorted longest-first so e.g. "United States of America" beats "United States".
    const COUNTRIES = [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
        "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
        "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
        "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
        "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
        "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
        "Canada", "Central African Republic", "Chad", "Chile", "China",
        "Colombia", "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus",
        "Czech Republic", "Czechia", "Democratic Republic of the Congo",
        "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
        "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
        "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
        "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
        "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
        "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia",
        "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
        "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
        "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
        "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
        "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia",
        "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
        "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
        "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
        "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
        "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
        "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
        "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
        "Portugal", "Qatar", "Republic of the Congo", "Romania", "Russia",
        "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
        "Saint Vincent and the Grenadines", "Samoa", "San Marino",
        "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
        "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
        "Solomon Islands", "Somalia", "South Africa", "South Korea",
        "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
        "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
        "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
        "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
        "United Arab Emirates", "United Kingdom",
        "United States of America", "United States", "Uruguay",
        "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
        "Yemen", "Zambia", "Zimbabwe",
        // Common abbreviations / alternate forms
        "UAE", "USA", "US", "UK"
    ];

    COUNTRIES.sort((a, b) => b.length - a.length);

    for (const country of COUNTRIES) {

        if (new RegExp(`\\b${country}\\b`, "i").test(headerText)) {
            profile.country = country;
            break;
        }

    }

    // ----------------------------
    // Education
    // ----------------------------

    const DEGREE_RE =
        /\b(Bachelor[s']?|Master[s']?|Doctor(?:ate)?|Ph\.?D\.?|M\.?D\.?|B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|B\.?Sc\.?|M\.?Sc\.?|B\.?Eng\.?|M\.?Eng\.?|B\.?Tech\.?|M\.?Tech\.?|Associate[s']?|Diploma|LL\.?B\.?|LL\.?M\.?|B\.?Com\.?|M\.?Com\.?|D\.?Phil\.?|HND|BTEC)\b/i;

    const INSTITUTION_RE =
        /university|college|institute|school|academy|polytechnic|faculty/i;

    // University — find the line (in edu section first, then full text)
    // and store ONLY the institution name, not the whole line
    const uniLine =
        eduLines.find(l => INSTITUTION_RE.test(l)) ||
        lines.find(l => INSTITUTION_RE.test(l));

    if (uniLine) {

        // The institution name usually ends at a comma, pipe, or city name.
        // Take everything up to the first comma or pipe.
        const uniName = uniLine.split(/[,|]/)[0].trim();
        profile.university = uniName;

    }

    // Degree — find in edu text, stop at a delimiter
    const degreeLineMatch = eduText.match(
        /\b(Bachelor[s']?|Master[s']?|Doctor(?:ate)?|Ph\.?D\.?|M\.?D\.?|B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|B\.?Sc\.?|M\.?Sc\.?|B\.?Eng\.?|M\.?Eng\.?|B\.?Tech\.?|M\.?Tech\.?|Associate[s']?|Diploma|LL\.?B\.?|LL\.?M\.?|B\.?Com\.?|M\.?Com\.?|D\.?Phil\.?|HND|BTEC)\b[^,|\n\-–—]*(?:(?:in|of)\s+[A-Z][a-zA-Z\s&]+)?/i
    );

    if (degreeLineMatch) {

        profile.degree = degreeLineMatch[0].trim().replace(/\s+/g, " ");

        // Extract major from within the degree string: "... in Computer Science"
        const majorMatch = profile.degree.match(
            /\b(?:in|of)\s+([A-Z][a-zA-Z\s&]+?)(?:\s*(?:,|-|–|from|at|\d{4})|$)/i
        );

        if (majorMatch) profile.major = majorMatch[1].trim();

    }

    // Graduation year — latest plausible year in education section
    const YEAR_RE = /\b(19|20)\d{2}\b/g;

    const eduYears = [...eduText.matchAll(YEAR_RE)]
        .map(m => parseInt(m[0]))
        .filter(y => y >= 1970 && y <= 2035);

    if (eduYears.length) {

        profile.graduationYear = Math.max(...eduYears).toString();

    }

    // ----------------------------
    // Current Company
    // PDF often puts everything on one line, e.g.:
    //   "Frontend Developer Intern  July-Sept 2025  Sharkstack Pakistan  Lahore, Pakistan"
    // Strategy:
    //   1. Find the first date-like token in the experience section.
    //   2. The company name usually appears AFTER the date on the same line,
    //      or on the very next line.
    //   3. Fall back to the first short capitalised line that isn't a title.
    //
    // Location fragments are excluded generically: any candidate that
    // matches the city / state / country already detected for THIS resume
    // is skipped, rather than relying on a fixed list of known city names.
    // ----------------------------

    const DATE_RE =
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present|current)\b/i;

    const TITLE_RE =
        /engineer|developer|manager|analyst|designer|intern|consultant|director|lead|officer|specialist|coordinator|executive|architect|scientist|researcher|programmer/i;

    const knownLocationWords = [profile.city, profile.stateProvince, profile.country]
        .filter(Boolean)
        .map(w => w.toLowerCase());

    function looksLikeLocation(part) {

        const normalizedPart = part.toLowerCase().replace(/[,.]/g, "").trim();

        // Matches a location we already detected for this resume
        if (knownLocationWords.includes(normalizedPart)) return true;

        // Matches a known country name outright
        if (COUNTRIES.some(c => c.toLowerCase() === normalizedPart)) return true;

        // "City, Country" / "City, State" shaped fragment
        if (/^[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+$/.test(part.trim())) return true;

        return false;

    }

    // Try to find company name after date token on the same line
    for (const line of expLines) {

        if (!DATE_RE.test(line)) continue;

        // Remove date ranges like "July-Sept 2025" or "2023 – 2025"
        const stripped = line
            .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s\-–—]+\w+\s*\d{0,4}/gi, "")
            .replace(/\b\d{4}\s*[-–—]\s*(\d{4}|present|current)\b/gi, "")
            .replace(/\b\d{4}\b/g, "")
            .trim();

        // Split on two or more spaces (common PDF column separator)
        const parts = stripped
            .split(/\s{2,}|\t/)
            .map(p => p.trim())
            .filter(p => p.length > 1);

        for (const part of parts) {

            if (TITLE_RE.test(part)) continue;
            if (DATE_RE.test(part)) continue;
            if (part.length > 60) continue;
            if (!/^[A-Z]/.test(part)) continue;
            if (looksLikeLocation(part)) continue;

            profile.currentCompany = part;
            break;

        }

        if (profile.currentCompany) break;

    }

    // Fallback: first short capitalised non-title line in experience section
    if (!profile.currentCompany) {

        for (const line of expLines) {

            if (DATE_RE.test(line)) continue;
            if (TITLE_RE.test(line)) continue;
            if (line.length > 60) continue;
            if (/^[•\-*]/.test(line)) continue;
            if (looksLikeLocation(line)) continue;
            if (/^[A-Z]/.test(line)) {
                profile.currentCompany = line.trim();
                break;
            }

        }

    }

    return profile;

}