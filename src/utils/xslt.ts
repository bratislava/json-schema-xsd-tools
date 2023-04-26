/* eslint-disable no-secrets/no-secrets */
import * as cheerio from 'cheerio'
import defaultPdfTemplate from '../templates/template.fo.xslt'
import defaultHtmlTemplate from '../templates/template.html.xslt'
import defaultTextTemplate from '../templates/template.sb.xslt'
import { JsonSchema, JsonSchemaFormat, JsonSchemaProperties, JsonSchemaType, mergeJsonSchema } from './forms'
import { firstCharToUpper, formatUnicorn, toSnakeCase } from './strings'

export type TransformationType = 'text' | 'html' | 'pdf'

const buildNode = (el: string, type: JsonSchemaType, format: JsonSchemaFormat): string => {
  if (type === 'string') {
    if (format === 'date') {
      return `<xsl:with-param name="node"><xsl:call-template name="base_format_date"><xsl:with-param name="instr" select="$values/z:${el}" /></xsl:call-template></xsl:with-param>`
    } else if (format === 'date-time') {
      return `<xsl:with-param name="node"><xsl:call-template name="base_format_datetime"><xsl:with-param name="dateTime" select="$values/z:${el}" /></xsl:call-template></xsl:with-param>`
    } else if (format === 'ciselnik') {
      return `<xsl:with-param name="node" select="$values/z:${el}/z:Name" />`
    } else if (format === 'file') {
      return `<xsl:with-param name="node" select="$values/z:${el}/z:Nazov" />`
    }
  } else if (type === 'boolean') {
    return `<xsl:with-param name="node"><xsl:call-template name="base_boolean"><xsl:with-param name="bool" select="$values/z:${el}" /></xsl:call-template></xsl:with-param>`
  }

  return `<xsl:with-param name="node" select="$values/z:${el}" />`
}

const buildXslt = (
  rootEl: cheerio.Cheerio<cheerio.Element>,
  templateName: string,
  properties: JsonSchemaProperties
) => {
  const template = []

  template.push(`<xsl:template name="${templateName}">`)
  template.push(`<xsl:param name="values"/>`)

  Object.keys(properties).forEach((childKey) => {
    const childProperty = properties?.[childKey]
    if (childProperty) {
      const el = firstCharToUpper(childKey)

      if (childProperty.type === 'array' && childProperty.items) {
        const isAttachment =
          childProperty.items && childProperty.items.type === 'string' && childProperty.items.format === 'file'
        template.push(
          `<xsl:for-each select="$values/z:${el}">
              <xsl:call-template name="base_labeled_field">
                <xsl:with-param name="text" select="'${childProperty.title || childKey}'" />
                <xsl:with-param name="node" select="${isAttachment ? 'z:Nazov' : '.'}" />
              </xsl:call-template>
            </xsl:for-each>`
        )
      } else if (childProperty.type === 'object') {
        const childTemplateName = toSnakeCase(childKey)
        template.push(
          `<xsl:call-template name="${childTemplateName}">
              <xsl:with-param name="values" select="$values/*[local-name() = '${el}']" />
            </xsl:call-template>`
        )

        buildXslt(rootEl, childTemplateName, mergeJsonSchema(childProperty).properties)
      } else {
        template.push(
          `<xsl:if test="$values/z:${el}"><xsl:call-template name="base_labeled_field">
              <xsl:with-param name="text" select="'${childProperty.title || childKey}'" />
              ${buildNode(el, childProperty.type, childProperty.format)}
            </xsl:call-template></xsl:if>`
        )
      }
    }
  })

  template.push(`</xsl:template>`)
  rootEl.append(template.join(''))
}

/**
 * Loads JSON schema and returns generated stylesheet.
 *
 * @remarks
 *
 * Properties are generated into body of xslt template:
 * ```xml
 * <xsl:template name="body">
 *
 * </xsl:template>
 * ```
 *
 * @param jsonSchema - JSON schema
 * @param xsltTemplate - XSLT template including basic format-specific templates (prefixed with "base_")
 * @returns stylesheet
 */
export const loadAndBuildXslt = (jsonSchema: JsonSchema, xsltTemplate: string): string => {
  const $ = cheerio.load(xsltTemplate, { xmlMode: true, decodeEntities: false })
  const mapEl = $(`xsl\\:template[name='map'] > xsl\\:choose`)
  const bodyEl = $(`xsl\\:template[name='body']`)
  const rootEl = $(`xsl\\:stylesheet`)

  const oneLevelProperties: JsonSchemaProperties = {}
  const { properties } = mergeJsonSchema(jsonSchema)

  Object.keys(properties).forEach((key) => {
    const property = properties[key]
    if (property) {
      const templateName = toSnakeCase(key)

      const childProperties = mergeJsonSchema(property).properties
      if (Object.keys(childProperties).length > 0) {
        mapEl.append(
          `<xsl:when test="$template = '${templateName}'">
            <xsl:call-template name="${templateName}">
              <xsl:with-param name="values" select="$values" />
            </xsl:call-template>
          </xsl:when>`
        )

        bodyEl.append(
          `<xsl:call-template name="base_block_with_title">
            <xsl:with-param name="template_name" select="'${templateName}'" />
            <xsl:with-param name="title" select="'${property.title || key}'" />
            <xsl:with-param name="values" select="z:Body/z:${firstCharToUpper(key)}" />
          </xsl:call-template>`
        )

        buildXslt(rootEl, templateName, childProperties)
      } else {
        oneLevelProperties[key] = property
      }
    }
  })

  if (Object.keys(oneLevelProperties).length > 0) {
    const templateName = 'wrapper'
    mapEl.append(
      `<xsl:when test="$template = '${templateName}'">
        <xsl:call-template name="${templateName}">
          <xsl:with-param name="values" select="$values" />
        </xsl:call-template>
      </xsl:when>`
    )

    bodyEl.append(
      `<xsl:call-template name="base_block_with_title">
        <xsl:with-param name="template_name" select="'${templateName}'" />
        <xsl:with-param name="title" select="'Ostatné'" />
        <xsl:with-param name="values" select="z:Body" />
      </xsl:call-template>`
    )

    // bodyEl.append(
    //   `<xsl:call-template name="${templateName}">
    //     <xsl:with-param name="values" select="z:Body" />
    //   </xsl:call-template>`
    // )
    buildXslt(rootEl, templateName, oneLevelProperties)
  }

  return $.html()
}

/**
 * Loads JSON schema and returns generated stylesheet.
 *
 *
 * @param jsonSchema - JSON schema
 * @param tranformationType - type of transformation
 * @param identifier - Form identifier
 * @param version - Form version
 * @returns stylesheet
 */
export const loadAndBuildDefaultXslt = (
  jsonSchema: JsonSchema,
  tranformationType: TransformationType,
  identifier: string | undefined = 'form',
  version: string | undefined = '0.1'
): string => {
  let template
  switch (tranformationType) {
    case 'text':
      template = defaultTextTemplate
      break
    case 'html':
      template = defaultHtmlTemplate
      break
    case 'pdf':
      template = defaultPdfTemplate
      break
    default:
      return ''
  }

  template = formatUnicorn(template, {
    eformIdentifier: identifier,
    eformVersion: version,
  })
  return loadAndBuildXslt(jsonSchema, template)
}
