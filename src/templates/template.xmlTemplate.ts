// the generated xml template must have no body, otherwise it's the same as template.xml.ts
/* eslint-disable no-secrets/no-secrets */
export default `<?xml version="1.0" encoding="utf-8"?>
<E-form xmlns="http://schemas.gov.sk/form/{eformIdentifier}/{eformVersion}"
        xsi:schemaLocation="http://schemas.gov.sk/form/{eformIdentifier}/{eformVersion} schema.xsd"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Meta>
    <ID>{eformIdentifier}</ID>
    <Name>{eformTitle}</Name>
    <Gestor>{gestor}</Gestor>
    <RecipientId></RecipientId>
    <Version>{eformVersion}</Version>
    <ZepRequired>{zepRequired}</ZepRequired>
    <EformUuid>string</EformUuid>
    <SenderID>mailto:</SenderID>
  </Meta>
</E-form>`
