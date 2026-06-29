chrome.runtime.onMessage.addListener((message) => {

    if (message.action !== "fillForm") return;

    chrome.storage.local.get(
        ["profiles", "activeProfile"],
        ({ profiles, activeProfile }) => {

            if (!profiles || profiles.length === 0) {
                alert("No profiles found.");
                return;
            }

            const active = profiles.find(p => p.id === activeProfile) || profiles[0];
            const profile = active.data;

            const fields = document.querySelectorAll("input, textarea, select");

            // Native setters for React/Vue compatibility
            const nativeInputSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
            )?.set;

            const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value"
            )?.set;

            fields.forEach(input => {

                let labelText = "";

                // Method 1: <label for="">
                if (input.id) {
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    if (label) labelText += " " + label.textContent;
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

                // Method 4: Immediate parent
                const parent = input.parentElement;
                if (parent) {
                    labelText += " " + parent.textContent;
                }

                // Method 5: Walk up the DOM tree (generic)
                // Helps with Google Forms, Workday, Greenhouse, Lever, etc.
                let ancestor = input.parentElement;

                for (let level = 0; level < 5 && ancestor; level++) {

                    labelText += " " + ancestor.textContent;

                    if (ancestor.previousElementSibling) {
                        labelText += " " + ancestor.previousElementSibling.textContent;
                    }

                    if (ancestor.nextElementSibling) {
                        labelText += " " + ancestor.nextElementSibling.textContent;
                    }

                    ancestor = ancestor.parentElement;
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

                        if (input.tagName === "TEXTAREA" && nativeTextareaSetter) {
                            nativeTextareaSetter.call(input, value);
                        }
                        else if (input.tagName === "INPUT" && nativeInputSetter) {
                            nativeInputSetter.call(input, value);
                        }
                        else {
                            input.value = value;
                        }

                    }

                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    input.dispatchEvent(new Event("blur", { bubbles: true }));

                    console.log(`Filled ${key}: ${value}`);

                } catch (error) {
                    console.error("Fill Error:", error);
                }

            });

        }
    );

});