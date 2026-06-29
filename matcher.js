const aliases = {

    firstName: [
        "firstname",
        "first_name",
        "first-name",
        "givenname",
        "given_name",
        "given-name",
        "fname"
    ],

    lastName: [
        "lastname",
        "last_name",
        "last-name",
        "surname",
        "familyname",
        "family_name",
        "family-name",
        "lname"
    ],

    email: [
        "email",
        "emailaddress",
        "email_address",
        "workemail",
        "candidateemail",
        "primaryemail",
        "e-mail"
    ],

    phone: [
        "phone",
        "phonenumber",
        "phone_number",
        "mobile",
        "mobilenumber",
        "mobile_number",
        "contact",
        "contactnumber",
        "contact_number",
        "telephone",
        "cell",
        "cellphone",
        "cell_phone"
    ],

    address: [
        "address",
        "address1",
        "address2",
        "addressline1",
        "addressline2",
        "address_line_1",
        "address_line_2",
        "street",
        "street1",
        "street2",
        "streetaddress",
        "street_address",
        "mailingaddress",
        "mailing_address",
        "residentialaddress",
        "residential_address",
        "homeaddress",
        "home_address",
        "currentaddress",
        "current_address",
        "permanentaddress",
        "permanent_address",
        "physicaladdress",
        "physical_address"
    ],

    city: [
        "city",
        "town",
        "municipality"
    ],

    stateProvince: [
        "state",
        "province",
        "stateprovince",
        "state_province",
        "region",
        "territory",
        "statename",
        "state_name"
    ],

    country: [
        "country",
        "nation",
        "countryregion",
        "country_region"
    ],

    postalCode: [
        "postalcode",
        "postal_code",
        "postcode",
        "zip",
        "zipcode",
        "zip_code",
        "zippostalcode"
    ],

    linkedin: [
        "linkedin",
        "linkedinprofile",
        "linkedin_profile",
        "linkedinurl",
        "linkedin_url"
    ],

    github: [
        "github",
        "githubprofile",
        "github_profile",
        "githuburl",
        "github_url"
    ],

    portfolio: [
        "portfolio",
        "portfolio_url",
        "portfoliourl",
        "website",
        "websiteurl",
        "website_url",
        "personalwebsite",
        "personal_website",
        "personalportfolio"
    ],

    university: [
        "university",
        "college",
        "school",
        "institution",
        "educationalinstitution",
        "education"
    ],

    degree: [
        "degree",
        "qualification",
        "highestdegree",
        "highest_degree"
    ],

    major: [
        "major",
        "fieldofstudy",
        "field_of_study",
        "specialization",
        "discipline"
    ],

    graduationYear: [
        "graduationyear",
        "graduation_year",
        "gradyear",
        "grad_year",
        "passingyear",
        "passing_year"
    ],

    currentCompany: [
        "currentcompany",
        "current_company",
        "company",
        "employer",
        "organization",
        "currentemployer"
    ],

    fullName: [
        "fullname",
        "full_name",
        "full-name",
        "applicantname",
        "applicant_name",
        "candidate_name",
        "candidatename",
        "yourname",
        "your_name",
        "name"
    ]

};

function normalize(text) {
    return (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function findProfileKey(text) {

    const normalized = normalize(text);

    // ===== Give Full Name highest priority =====
    if (
        normalized.includes("fullname") ||
        normalized.includes("full_name") ||
        normalized.includes("full-name") ||
        normalized.includes("applicantname") ||
        normalized.includes("candidatename") ||
        normalized.includes("yourname")
    ) {
        return "fullName";
    }

    // Check all other aliases
    for (const key in aliases) {

        // Skip fullName because we've already handled it
        if (key === "fullName") continue;

        for (const alias of aliases[key]) {

            if (normalized.includes(normalize(alias))) {
                return key;
            }

        }

    }

    // Finally check generic fullName aliases like "name"
    for (const alias of aliases.fullName) {

        if (normalized.includes(normalize(alias))) {
            return "fullName";
        }

    }

    return null;
}