// Phong fragment shader phong-tex.frag matched with phong-tex.vert
#version 330

// Some drivers require the following
precision highp float;

struct lightStruct
{
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

struct materialStruct
{
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	float shininess;
};

uniform lightStruct light;
uniform materialStruct material;
uniform sampler2D textureUnit0;
uniform samplerCube textureUnit1;
uniform float attConst;
uniform float attLinear;
uniform float attQuadratic;
uniform float dispersionSize;


//get the refract  for each color
vec3 refractR;
vec3 refractG;
vec3 refractB;

in vec3 ex_WorldNorm;
in vec3 ex_WorldView;
in vec3 ex_N;
in vec3 ex_V;
in vec3 ex_L;
in float ex_D;
layout(location = 0) out vec4 out_Color;
vec4 reflect;
 
void main(void) {
    
	// Ambient intensity
	vec4 ambientI = light.ambient * material.ambient;

	// Diffuse intensity
	vec4 diffuseI = light.diffuse * material.diffuse;
	diffuseI = diffuseI * max(dot(normalize(ex_N),normalize(ex_L)),0);

	// Specular intensity
	// Calculate R - reflection of light
	vec3 R = normalize(reflect(normalize(-ex_L),normalize(ex_N)));

	vec4 specularI = light.specular * material.specular;
	specularI = specularI * pow(max(dot(R,ex_V),0), material.shininess);

	float attenuation=1.0f/(attConst + attLinear * ex_D + attQuadratic * ex_D*ex_D);
	
	//separating each component of the light and refracting each component with different direction
	refractR = refract(-ex_WorldView, ex_WorldNorm,dispersionSize); 
	refractG = refract(-ex_WorldView, ex_WorldNorm, dispersionSize * 2 ); 
	refractB = refract(-ex_WorldView, ex_WorldNorm,dispersionSize * 3 ); 
	
	//world reversed in the object so reversing each coordinates
	refractR.y = -refractR.y;
	refractG.y = -refractG.y;
	refractB.y = -refractB.y;

	vec4 refractCalculatedColor;

	//calculating the color applied with the texture of the environnement
	refractCalculatedColor.x = textureCube(textureUnit1, refractR).r;  
    refractCalculatedColor.y = textureCube(textureUnit1, refractG).g;  
    refractCalculatedColor.z = textureCube(textureUnit1, refractB).b;  
    refractCalculatedColor.a = 1.0;

	//Attenuation does not affect transparency
	vec4 litColour = (ambientI + vec4((diffuseI.rgb *specularI.rgb)/attenuation,1.0));
	vec3 reflectTexCoord = reflect(-ex_WorldView, normalize(ex_WorldNorm));
	reflectTexCoord.y = reflectTexCoord.y ;

	//initial
	reflect = texture(textureUnit1, reflectTexCoord) * litColour;

	vec4 combinedColor = mix(refractCalculatedColor, reflect, 0);
	out_Color = combinedColor;
}