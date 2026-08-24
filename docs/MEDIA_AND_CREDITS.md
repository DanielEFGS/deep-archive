# Media, attribution and disclaimer

## Intended project footer

**Educational & non-commercial visual study · Individual media credits preserved · Independent project, not NASA-affiliated.**

## Longer disclosure

> DEEP / 500 is an independent educational and informational frontend experiment. Astronomical imagery and related metadata may be sourced from publicly available NASA resources. NASA, collaborating institutions, photographers and other credited creators remain the sources of the original material. This project is not affiliated with, sponsored by, or endorsed by NASA. Third-party material remains subject to its respective rights and usage terms.

## Important implementation rule

Do not replace individual credits with a blanket `© NASA` label.

The catalog stores the supplied source, NASA ID, center/creator fields and a credit string for each item. A public release should be manually reviewed because NASA notes that some material hosted on its sites belongs to third parties and NASA's own permission does not transfer those third-party rights.

## NASA branding

This application deliberately does not use NASA's insignia, seal or logotype as its own branding. The visual identity is `DEEP / 500`.

## Source link

Every real catalog record should retain a link to its original NASA Image and Video Library details page so users can inspect the authoritative context and available media.

## Real NASA pilot review

The current build preserves individual source URLs and supplied credits for all 500 records. Fifteen records contain explicit rights/copyright signals and are listed in `reports/media-review.json`; this queue requires human review before publication. Curatorial inclusion is not rights clearance.

## References

- NASA Images and Media Usage Guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/
- NASA Image and Video Library API: https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
