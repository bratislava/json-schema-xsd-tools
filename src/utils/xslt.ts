/* eslint-disable no-secrets/no-secrets */
import * as cheerio from 'cheerio'
import defaultPdfTemplate from '../templates/template.fo.xslt'
import defaultHtmlTemplate from '../templates/template.html.xslt'
import defaultTextTemplate from '../templates/template.sb.xslt'
import {
  getAllPossibleJsonSchemaProperties,
  JsonSchema,
  JsonSchemaFormat,
  JsonSchemaProperties,
  JsonSchemaType,
  mergeJsonSchema
} from './forms'
import { firstCharToUpper, toSnakeCase } from './strings'

const buildNode = (el: string, type: JsonSchemaType, format: JsonSchemaFormat): string => {
  if (type === 'string') {
    if (format === 'date') {
      return `<xsl:with-param name="node"><xsl:call-template name="base_format_date"><xsl:with-param name="instr" select="$values/z:${el}" /></xsl:call-template></xsl:with-param>`
    } else if (format === 'date-time') {
      return `<xsl:with-param name="node"><xsl:call-template name="base_format_datetime"><xsl:with-param name="dateTime" select="$values/z:${el}" /></xsl:call-template></xsl:with-param>`
    } else if (format === 'ciselnik') {
      return `<xsl:with-param name="node" select="$values/z:${el}/z:Name" />`
    } else if (format === 'data-url') {
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
          childProperty.items && childProperty.items.type === 'string' && childProperty.items.format === 'data-url'
        template.push(
          `<xsl:for-each select="$values/z:${el}">
              <xsl:call-template name="base_labeled_field">
                <xsl:with-param name="text" select="'${childProperty.title}'" />
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

        buildXslt(rootEl, childTemplateName, getAllPossibleJsonSchemaProperties(childProperty))
      } else {
        template.push(
          `<xsl:if test="$values/z:${el}"><xsl:call-template name="base_labeled_field">
              <xsl:with-param name="text" select="'${childProperty.title}'" />
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
  const properties = getAllPossibleJsonSchemaProperties(mergeJsonSchema(jsonSchema))
  Object.keys(properties).forEach((key) => {
    const property = properties[key]
    if (property) {
      const templateName = toSnakeCase(key)

      if (property.properties) {
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
            <xsl:with-param name="title" select="'${property.title}'" />
            <xsl:with-param name="values" select="z:Body/z:${firstCharToUpper(key)}" />
          </xsl:call-template>`
        )

        buildXslt(rootEl, templateName, getAllPossibleJsonSchemaProperties(property))
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
 * Loads JSON schema and returns generated text stylesheet.
 *
 * @param jsonSchema - JSON schema
 * @returns text stylesheet
 */
export const loadAndBuildTextXslt = (jsonSchema: JsonSchema): string => {
  return loadAndBuildXslt(jsonSchema, defaultTextTemplate)
}

/**
 * Loads JSON schema and returns generated html stylesheet.
 *
 * @param jsonSchema - JSON schema
 * @returns html stylesheet
 */
export const loadAndBuildHtmlXslt = (jsonSchema: JsonSchema): string => {
  return loadAndBuildXslt(jsonSchema, defaultHtmlTemplate)
}

/**
 * Loads JSON schema and returns generated pdf stylesheet.
 *
 * @param jsonSchema - JSON schema
 * @returns pdf stylesheet
 */
export const loadAndBuildPdfXslt = (jsonSchema: JsonSchema): string => {
  return loadAndBuildXslt(jsonSchema, defaultPdfTemplate)
}
