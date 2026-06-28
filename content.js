chrome.runtime.onMessage.addListener((message) => {

    if (message.action !== "fillForm") return;

    chrome.storage.local.get("profile", ({ profile }) => {

        if (!profile) {
            alert("No profile saved.");
            return;
        }

        const fields = document.querySelectorAll(
            "input, textarea, select"
        );

        fields.forEach(input => {

            let labelText = "";

            // Method 1: <label for="">
            if (input.id) {

                const label = document.querySelector(
                    `label[for="${input.id}"]`
                );

                if (label) {
                    labelText += " " + label.textContent;
                }

            }

            // Method 2: <label><input></label>
            const parentLabel = input.closest("label");

            if (parentLabel) {
                labelText += " " + parentLabel.textContent;
            }

            // Method 3: Previous sibling
            const previousElement = input.previousElementSibling;

            if (previousElement) {
                labelText += " " + previousElement.textContent;
            }

            // Method 4: Parent container
            const parent = input.parentElement;

            if (parent) {
                labelText += " " + parent.textContent;
            }

            const searchableText = [

                input.name,
                input.id,
                input.placeholder,
                input.getAttribute("aria-label"),
                input.getAttribute("autocomplete"),
                input.title,
                labelText

            ].join(" ");

            const key = findProfileKey(searchableText);

            if (!key) return;

            let value = profile[key];

            // Generate Full Name automatically
            if (key === "fullName") {
                value = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
            }

            if (!value) return;

            try {

                // Handle native dropdowns
                if (input.tagName === "SELECT") {

                    const normalizedValue = normalize(value);

                    let matched = false;

                    for (const option of input.options) {

                        const optionText = normalize(option.text);
                        const optionValue = normalize(option.value);

                        if (
                            optionText.includes(normalizedValue) ||
                            normalizedValue.includes(optionText) ||
                            optionValue.includes(normalizedValue) ||
                            normalizedValue.includes(optionValue)
                        ) {

                            input.value = option.value;
                            matched = true;
                            break;

                        }

                    }

                    if (!matched) return;

                } else {

                    input.value = value;

                }

                input.dispatchEvent(
                    new Event("input", {
                        bubbles: true
                    })
                );

                input.dispatchEvent(
                    new Event("change", {
                        bubbles: true
                    })
                );

                console.log(`Filled ${key}: ${value}`);

            }

            catch (error) {

                console.error("Fill Error:", error);

            }

        });

    });

});